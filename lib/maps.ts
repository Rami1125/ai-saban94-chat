// lib/maps.ts
const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;

export async function getTravelData(origin: string, destination: string) {
  try {
    // שימוש ב-Distance Matrix API
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${GOOGLE_KEY}`;
    
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'OK') {
      const element = data.rows[0].elements[0];
      return {
        distance: element.distance.text, // מרחק (למשל: 15 ק"מ)
        duration: element.duration.text, // זמן (למשל: 25 דקות)
        status: 'success'
      };
    }
    return { status: 'error', message: 'לא נמצא מסלול' };
  } catch (error) {
    return { status: 'error', message: 'תקלת תקשורת' };
  }
}
