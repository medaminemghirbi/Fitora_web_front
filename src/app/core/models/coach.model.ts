export interface Coach {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  photo_url: string | null;
  birthdate: string | null;
  active: boolean;
  location_ids: string[];
  has_login: boolean;
  login_email: string | null;
}
