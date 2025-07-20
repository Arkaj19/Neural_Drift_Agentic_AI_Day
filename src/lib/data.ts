export const keyMetrics = {
    "Total Crowd": { value: '12,847', change: '+5.2%', changeType: 'increase' as const },
    "Active Guards": { value: '24', change: '0%', changeType: 'neutral' as const },
    "Active Alerts": { value: '3', change: '+25%', changeType: 'increase' as const },
    "System Status": { value: '98%', change: '+2.1%', changeType: 'increase' as const },
};

export const guards = [
    { name: 'Yashpal Rana', sector: 'A', location: 'Main Gate', status: 'Active' as const, avatar: '/avatars/01.png' },
    { name: 'Mahesh Shetty', sector: 'B', location: 'Food Court', status: 'Alert' as const, avatar: '/avatars/02.png' },
    { name: 'Harjit Dhillon', sector: 'C', location: 'Concert Stage', status: 'Active' as const, avatar: '/avatars/03.png' },
    { name: 'Devika Pillai', sector: 'D', location: 'Parking Area', status: 'Standby' as const, avatar: '/avatars/04.png' },
    { name: 'Rajesh Kumar', sector: 'E', location: 'VIP Area', status: 'Active' as const, avatar: '/avatars/05.png' },
    { name: 'Meera Chauhan', sector: 'F', location: 'Emergency Exit', status: 'Active' as const, avatar: '/avatars/06.png' },
];

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
    { name: 'Main Stage', capacity: 85, status: 'normal' as const },
    { name: 'Food Court', capacity: 95, status: 'alert' as const },
    { name: 'Entrance Gate', capacity: 70, status: 'normal' as const },
    { name: 'VIP Area', capacity: 60, status: 'normal' as const },
    { name: 'Parking Area', capacity: 45, status: 'normal' as const },
    { name: 'Emergency Exit', capacity: 30, status: 'alert' as const },
];
