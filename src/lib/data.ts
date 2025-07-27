
export const keyMetrics = {
    "Active Guards": { value: '0', change: '+0', changeType: 'neutral' as const }, // This will be updated from Firestore
    "Active Alerts": { value: '0', change: '+0', changeType: 'neutral' as const },
};

export type Guard = {
    id: string;
    name: string;
    sector: string;
    status: 'Active' | 'Alert' | 'Standby';
    phone: string;
};

export const alerts = [
    { type: 'Violence', location: 'Sector B - Food Court', time: '2 min ago', priority: 'High' as const },
    { type: 'Crowding', location: 'Sector C - Concert Stage', time: '5 min ago', priority: 'Medium' as const },
    { type: 'Predicted Crowding', location: 'Sector A - Main Gate', time: '8 min ago', priority: 'Low' as const },
];

export const cameras = [
    { id: 'CAM-001', location: 'Main Gate', resolution: '1920x1080', fps: 30, viewers: 12, status: 'Recording' as const, isRecording: true },
    { id: 'CAM-002', location: 'Food Court', resolution: '1920x1080', fps: 30, viewers: 25, status: 'Alert' as const, isRecording: true },
    { id: 'CAM-003', location: 'Concert Stage', resolution: '4K', fps: 60, viewers: 42, status: 'Recording' as const, isRecording: true },
    { id: 'CAM-004', location: 'Parking Area', resolution: '1280x720', fps: 24, viewers: 8, status: 'Normal' as const, isRecording: true },
    { id: 'CAM-005', location: 'Emergency Exit', resolution: '1920x1080', fps: 30, viewers: 4, status: 'Normal' as const, isRecording: true },
    { id: 'CAM-006', location: 'VIP Area', resolution: '4K', fps: 30, viewers: 7, status: 'Recording' as const, isRecording: true },
];

export const sectors = [
    { name: 'Main Gate', capacity: 85, status: 'normal' as const },
    { name: 'Food Court', capacity: 95, status: 'alert' as const },
    { name: 'Concert Stage', capacity: 70, status: 'normal' as const },
    { name: 'VIP Area', capacity: 60, status: 'normal' as const },
    { name: 'Parking Area', capacity: 45, status: 'normal' as const },
    { name: 'Emergency Exit', capacity: 30, status: 'alert' as const },
];
