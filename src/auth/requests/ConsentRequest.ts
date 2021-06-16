export interface ConsentRequest {
  submit: string;
  challenge: string;
  grantScope: string[];
  remember: boolean;
}
