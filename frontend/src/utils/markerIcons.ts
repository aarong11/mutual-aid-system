import L from 'leaflet';
import { ResourceType } from '../types';

// Fix Leaflet's default icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Create base icon configurations for different resource types
const createMarkerIcon = (color: string) => L.divIcon({
  className: 'custom-marker',
  html: `
    <svg width="24" height="36" viewBox="0 0 24 36">
      <path 
        fill="${color}" 
        d="M12 0C5.383 0 0 5.383 0 12c0 9 12 24 12 24s12-15 12-24c0-6.617-5.383-12-12-12z"
      />
      <circle fill="white" cx="12" cy="12" r="6" />
    </svg>
  `,
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36],
});

// Map resource types to specific colors and icons
export const resourceIcons: Record<ResourceType, L.DivIcon> = {
  [ResourceType.FOOD_BANK]: createMarkerIcon('#e74c3c'), // Red
  [ResourceType.SHELTER]: createMarkerIcon('#3498db'),   // Blue
  [ResourceType.MEDICAL]: createMarkerIcon('#2ecc71'),   // Green
  [ResourceType.CLOTHING]: createMarkerIcon('#9b59b6'),  // Purple
  [ResourceType.OTHER]: createMarkerIcon('#f1c40f'),     // Yellow
};

// Default icon for unknown resource types
export const defaultIcon = createMarkerIcon('#95a5a6');

export const getMarkerIcon = (resourceType: ResourceType): L.DivIcon => {
  return resourceIcons[resourceType] || defaultIcon;
};