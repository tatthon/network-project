export interface Group {
  name: string;
  members: string[];
}

export interface Message {
  from: string;
  to: string;
  text: string;
  timestamp: number;
  read: boolean;
}

export interface GroupMessage {
  group: string;
  text: string;
  from: string;
  read: boolean;
  read_number: number;
  read_peoples: string[];
  can_see: string[];
  timestamp: number;
}