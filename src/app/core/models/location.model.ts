export interface Location {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
  active: boolean;
  business_hours_start: string;
  business_hours_end: string;
}
