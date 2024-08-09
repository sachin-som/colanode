import jwt from 'jsonwebtoken';

const JwtSecretKey = process.env.JWT_SECRET ?? '';
const JwtAudience = process.env.JWT_AUDIENCE ?? '';
const JwtIssuer = process.env.JWT_ISSUER ?? '';

export type JwtPayload = {
  id: string;
  name: string;
  email: string;
};

export const createJwtToken = (payload: JwtPayload): string => {
  const signOptions: jwt.SignOptions = {
    issuer: JwtIssuer,
    audience: JwtAudience,
    subject: payload.id,
  };

  return jwt.sign(payload, JwtSecretKey, signOptions);
};

export const verifyJwtToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, JwtSecretKey, {
      issuer: JwtIssuer,
      audience: JwtAudience,
    });

    return decoded as JwtPayload;
  } catch (err) {
    return null;
  }
};
