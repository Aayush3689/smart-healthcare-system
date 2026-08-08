import type { AccessPolicy } from "../../common/policies/access.policy.js";
import type { TrendPointDto } from "./dto/phc-dashboard.dto.js";
import type { PhcDashboardRepository } from "./repository.js";
import type {
  AppointmentDashboardQuery,
  AshaDashboardQuery,
  DoctorDashboardQuery,
  FollowUpDashboardQuery,
  HighRiskDashboardQuery,
  ReferralDashboardQuery,
  TrendDashboardQuery,
  VillageDashboardQuery,
} from "./validation.js";

export class PhcDashboardService {
  public constructor(
    private readonly repository: PhcDashboardRepository,
    private readonly access: AccessPolicy,
  ) {}

  public async dashboard(userId: string) {
    const phcId = await this.phcId(userId);
    const [today, tomorrow] = this.today();
    const [summary, highlights] = await Promise.all([
      this.repository.summary(phcId, today, tomorrow),
      this.repository.highlights(phcId, today, tomorrow),
    ]);
    return {
      summary,
      recentReferrals: highlights.recentReferrals.map((item) => this.referral(item)),
      todayAppointments: highlights.todayAppointments.map((item) => this.appointment(item)),
      highRiskPatients: highlights.highRiskPatients.map((item) => this.highRisk(item)),
      followUpsDue: highlights.followUpsDue.map((item) => this.followUp(item)),
    };
  }

  public async referrals(userId: string, query: ReferralDashboardQuery) {
    const [items, total] = await this.repository.referrals(await this.phcId(userId), query);
    return this.paginated(
      items.map((item) => this.referral(item)),
      total,
      query,
    );
  }

  public async highRiskPatients(userId: string, query: HighRiskDashboardQuery) {
    const [items, total] = await this.repository.highRiskPatients(await this.phcId(userId), query);
    return this.paginated(
      items.map((item) => this.highRisk(item)),
      total,
      query,
    );
  }

  public async appointments(userId: string, query: AppointmentDashboardQuery) {
    const range = query.date ? this.day(query.date) : undefined;
    const [items, total] = await this.repository.appointments(
      await this.phcId(userId),
      query,
      range,
    );
    return this.paginated(
      items.map((item) => this.appointment(item)),
      total,
      query,
    );
  }

  public async followUps(userId: string, query: FollowUpDashboardQuery) {
    const range = query.from || query.to ? { gte: query.from, lte: query.to } : undefined;
    const [items, total] = await this.repository.followUps(await this.phcId(userId), query, range);
    return this.paginated(
      items.map((item) => this.followUp(item)),
      total,
      query,
    );
  }

  public async villages(userId: string, query: VillageDashboardQuery) {
    const [today, tomorrow] = this.today();
    const [items, total] = await this.repository.villages(
      await this.phcId(userId),
      query,
      today,
      tomorrow,
    );
    return this.paginated(items, total, query);
  }

  public async doctors(userId: string, query: DoctorDashboardQuery) {
    const [today, tomorrow] = this.today();
    const [items, total] = await this.repository.doctors(
      await this.phcId(userId),
      query,
      today,
      tomorrow,
    );
    return this.paginated(items, total, query);
  }

  public async ashaWorkers(userId: string, query: AshaDashboardQuery) {
    const [items, total] = await this.repository.ashaWorkers(await this.phcId(userId), query);
    return this.paginated(items, total, query);
  }

  public async trends(userId: string, query: TrendDashboardQuery) {
    const days = Number(query.period.slice(0, -1));
    const [today] = this.today();
    const from = new Date(today.getTime() - (days - 1) * 86_400_000);
    const [assessments, highRisk, referrals, appointments] = await this.repository.trends(
      await this.phcId(userId),
      from,
    );
    return {
      period: query.period,
      assessments: this.bucket(
        assessments.map((item) => item.createdAt),
        from,
        days,
      ),
      highRiskPatients: this.bucket(
        highRisk.map((item) => item.generatedAt),
        from,
        days,
      ),
      referrals: this.bucket(
        referrals.map((item) => item.createdAt),
        from,
        days,
      ),
      completedAppointments: this.bucket(
        appointments.map((item) => item.scheduledAt),
        from,
        days,
      ),
    };
  }

  private async phcId(userId: string) {
    return (await this.access.requireAdminPhc(userId)).phcId;
  }

  private referral(item: {
    id: string;
    priority: string;
    status: string;
    createdAt: Date;
    patient: { id: string; fullName: string; village: { id: string; name: string } };
  }) {
    return {
      id: item.id,
      patient: { id: item.patient.id, fullName: item.patient.fullName },
      village: item.patient.village,
      priority: item.priority,
      status: item.status,
      createdAt: item.createdAt,
    };
  }

  private appointment(item: {
    id: string;
    scheduledAt: Date;
    durationMinutes: number;
    status: string;
    patient: { id: string; fullName: string };
    doctor: { id: string; fullName: string };
  }) {
    return {
      id: item.id,
      patient: item.patient,
      doctor: item.doctor,
      date: item.scheduledAt.toISOString().slice(0, 10),
      startTime: item.scheduledAt.toISOString().slice(11, 16),
      durationMinutes: item.durationMinutes,
      status: item.status,
    };
  }

  private highRisk(item: {
    id: string;
    disease: string;
    riskLevel: string;
    probability: number;
    assessment: {
      id: string;
      patient: { id: string; fullName: string; village: { id: string; name: string } };
    };
  }) {
    return {
      patientId: item.assessment.patient.id,
      patientName: item.assessment.patient.fullName,
      village: item.assessment.patient.village,
      disease: item.disease,
      riskLevel: item.riskLevel,
      probability: item.probability,
      assessmentId: item.assessment.id,
      predictionId: item.id,
    };
  }

  private followUp(item: {
    id: string;
    scheduledDate: Date;
    status: string;
    patient: { id: string; fullName: string; village: { id: string; name: string } };
    assignedTo: { id: string; fullName: string };
  }) {
    return {
      id: item.id,
      patient: { id: item.patient.id, fullName: item.patient.fullName },
      village: item.patient.village,
      ashaWorker: item.assignedTo,
      dueDate: item.scheduledDate.toISOString().slice(0, 10),
      status: item.status,
    };
  }

  private paginated<T>(items: T[], total: number, query: { page: number; limit: number }) {
    return { items, pagination: { page: query.page, limit: query.limit, total } };
  }

  private today(): [Date, Date] {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    return [today, new Date(today.getTime() + 86_400_000)];
  }

  private day(date: Date) {
    const start = new Date(date);
    start.setUTCHours(0, 0, 0, 0);
    return { gte: start, lt: new Date(start.getTime() + 86_400_000) };
  }

  private bucket(values: Date[], from: Date, days: number): TrendPointDto[] {
    const counts = new Map<string, number>();
    for (const value of values) {
      const key = value.toISOString().slice(0, 10);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from({ length: days }, (_, index) => {
      const date = new Date(from.getTime() + index * 86_400_000).toISOString().slice(0, 10);
      return { date, count: counts.get(date) ?? 0 };
    });
  }
}
