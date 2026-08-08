import type { Role } from "@prisma/client";
import jwt from "jsonwebtoken";

export interface AccessTokenPayload {
  sub: string;
  role: Role;
}
export class JwtService {
  public constructor(
    private readonly secret: string,
    private readonly expiresIn = "15m",
  ) {}
  public sign(payload: AccessTokenPayload): string {
    return jwt.sign({ role: payload.role }, this.secret, {
      subject: payload.sub,
      expiresIn: this.expiresIn as jwt.SignOptions["expiresIn"],
    });
  }
  public verify(token: string): AccessTokenPayload {
    const payload = jwt.verify(token, this.secret) as jwt.JwtPayload;
    if (!payload.sub || typeof payload.role !== "string") throw new Error("Invalid token payload.");
    return { sub: payload.sub, role: payload.role as Role };
  }
}
