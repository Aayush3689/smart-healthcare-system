import nodemailer, { type Transporter } from "nodemailer";
export interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  from: string;
  user: string;
  password: string;
}
export class MailService {
  private readonly transporter: Transporter;
  public constructor(private readonly config: MailConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
    });
  }
  public async sendLoginOtp(to: string, otp: string): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.from,
      to,
      subject: "Your Smart Healthcare login code",
      text: `Your verification code is ${otp}. It expires in 10 minutes.`,
    });
  }
}
