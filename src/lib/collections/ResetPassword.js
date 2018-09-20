import { object, string, ref } from 'yup';
import passwordRules from './helpers/passwordRules';

export default {
  type: 'ResetPassword',
  schema: object().shape({
    password: passwordRules({ label: 'Password' }),
    passwordConfirm: string()
      .label('Confirm Password')
      .required('You must enter the same password again to confirm it.')
      .oneOf([ref('password')], 'Passwords do not match'),
  }),
};
