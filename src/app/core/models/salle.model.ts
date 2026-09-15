export interface Salle {
  id: string;
  location_id: string;
  name: string;
  description: string | null;
  capacity: number;
  active: boolean;
  image_urls: string[];
}
