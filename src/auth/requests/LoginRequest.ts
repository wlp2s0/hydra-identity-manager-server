export interface LoginRequest {
  challenge: string;
  submit: string;
  email: string;
  password: string;
  remember: boolean;
}
