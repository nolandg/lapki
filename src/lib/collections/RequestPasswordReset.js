import { object, string } from 'yup';

export default {
  type: 'RequestPasswordReset',
  schema: object().shape({
    email: string()
      .label('Email')
      .required()
      .trim(),
  }),
};
