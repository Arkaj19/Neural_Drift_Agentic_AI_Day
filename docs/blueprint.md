# **App Name**: Drishti AI: Event Guardian

## Core Features:

- Live Camera Feed: Displays real-time video feeds from multiple cameras, each labeled with its ID, location, resolution, frame rate, recording status, viewer count, and status badges, providing a live view of the event.
- Intelligent Alerting: Uses Vertex AI tool to detect and categorize incidents (violence, crowding) from video feeds, generating alerts with priority levels based on severity.
- Interactive Map View: Shows a venue layout with interactive location markers, color-coded status indicators, and sector capacity percentages for overall awareness.
- Real-time Incident Management: Alert cards display the alert type, sector, timestamp and priority with color-coded backgrounds.
- Executive Dashboard: Presents metrics cards, and a table listing names, assignments, status, and contact buttons for guards.
- User Authentication: Guards / Operators are authenticated with Firebase Authentication and assigned roles for access control.

## Style Guidelines:

- Primary color: Dark blue (#34495E) to establish a professional security-focused aesthetic.
- Background color: Very dark gray (#222F3D) for a dark theme, reducing eye strain in control room environments.
- Accent color: Light blue (#3498DB) to highlight interactive elements and important status indicators.
- Font: 'Inter' sans-serif, for both body and headlines. Note: currently only Google Fonts are supported.
- Use shield and alert icons for 'Drishti AI' logo and alert notifications.
- Header bar: Logo (left), status indicator and timestamp (right); Main section: Tabbed views (Live Feed, Map View, Alerts, Dashboard); Use grid layout to arrange camera views.
- Implement smooth transitions on tab navigation; loading animations while camera feeds refresh or while waiting on data from other integrations.