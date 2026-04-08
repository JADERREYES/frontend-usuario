export type AuthUser = {
  _id?: string;
  id?: string;
  email: string;
  name?: string;
  role?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  name?: string;
};
