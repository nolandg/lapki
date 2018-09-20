import { object, string } from 'yup';

export default {
  type: 'Login',
  schema: object().shape({
    email: string()
      .label('Email')
      .required()
      .trim(),
    password: string()
      .label('Password')
      .required()
      .trim(),
  }),
};
