import { Layout, Specification } from "@shared/schema";

export const COUNTRIES = [
  "United Kingdom",
  "United States",
  "Australia",
  "Germany",
  "France",
];

export const CITIES: Record<string, string[]> = {
  "United Kingdom": ["London", "Manchester", "Birmingham", "Edinburgh"],
  "United States": ["New York", "Chicago", "Los Angeles", "Boston"],
  "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth"],
  "Germany": ["Berlin", "Munich", "Frankfurt", "Hamburg"],
  "France": ["Paris", "Lyon", "Marseille", "Toulouse"],
};

export const CURRENCIES = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "AUD", name: "Australian Dollar" },
];

export const SPECIFICATION_LEVELS: Specification[] = ["Bronze", "Silver", "Gold"];

export const SPECIFICATION_DETAILS = {
  "Bronze": {
    description: "Standard specification with potential for future customization",
    features: [
      "Painted walls with minimal branding",
      "Single glazed partitions (38dB Rw)",
      "Standard carpet tiles",
      "Fixed desks",
      "Basic AV with audio conferencing"
    ],
    costFactor: 1.0
  },
  "Silver": {
    description: "Enhanced specification with more features",
    features: [
      "Feature walls with special finishes",
      "Double glazed partitions (45dB Rw)",
      "Upgraded flooring options",
      "Mix of static and height-adjustable desks",
      "Enhanced AV with video conferencing"
    ],
    costFactor: 1.4
  },
  "Gold": {
    description: "Premium specification with high-end finishes",
    features: [
      "Feature wall concepts throughout",
      "High-performance double glazing (50dB Rw)",
      "High-specification flooring",
      "Full sit-stand desk provision",
      "Premium AV throughout"
    ],
    costFactor: 1.8
  }
};

export const LAYOUT_TYPES: Layout[] = ["Activity", "Team", "Event"];

export const LAYOUT_DETAILS = {
  "Activity": {
    description: "Spaces designed around activities",
    features: [
      "Varied work settings for different tasks",
      "Focus areas, collaboration zones",
      "Supports dynamic work patterns"
    ]
  },
  "Team": {
    description: "Spaces organized by teams",
    features: [
      "Dedicated team neighborhoods",
      "Team meeting areas and project spaces",
      "Supports team identity and cohesion"
    ]
  },
  "Event": {
    description: "Flexible, reconfigurable spaces",
    features: [
      "Highly adaptable spaces",
      "Supports events, workshops, training",
      "Movable furniture and partitions"
    ]
  }
};

// Space types by layout
export const SPACE_TYPES = {
  "Activity": [
    { name: "Focus Area", defaultPercentage: 30 },
    { name: "Collaboration Area", defaultPercentage: 30 },
    { name: "Meeting Rooms", defaultPercentage: 20 },
    { name: "Social Area", defaultPercentage: 15 },
    { name: "Support/Ancillary", defaultPercentage: 5 }
  ],
  "Team": [
    { name: "Team Workspace", defaultPercentage: 50 },
    { name: "Team Meeting Area", defaultPercentage: 20 },
    { name: "Shared Meeting Rooms", defaultPercentage: 15 },
    { name: "Social Area", defaultPercentage: 10 },
    { name: "Support/Ancillary", defaultPercentage: 5 }
  ],
  "Event": [
    { name: "Flexible Event Space", defaultPercentage: 40 },
    { name: "Presentation Area", defaultPercentage: 20 },
    { name: "Breakout Areas", defaultPercentage: 20 },
    { name: "Support Space", defaultPercentage: 15 },
    { name: "Ancillary Space", defaultPercentage: 5 }
  ]
};
