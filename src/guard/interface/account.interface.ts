export interface IAccount {
  _id: string

  account_email: string

  account_password: string

  account_type: 'restaurant' | 'employee'

  account_role: string

  account_restaurant_id: string

  account_employee_id: string
}
