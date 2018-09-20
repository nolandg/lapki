import { string } from 'yup';

export default ({ label }) => string()
  .label('Password')
  .required()
  .min(8)
  .matches(/\d/, 'Password must contain at least one digit.')
  .matches(/[A-Z]/, 'Password must contain at least one uppercase letter.')
  .matches(/[a-z]/, 'Password must contain at least one lowercase letter.')
  .matches(/[^A-Za-z0-9]/, 'Password must contain at least one symbol like $, &, !, @, #, etc.');
