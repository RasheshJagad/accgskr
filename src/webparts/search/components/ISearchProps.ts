import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface ISearchProps {
  description: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  context: WebPartContext;
}
