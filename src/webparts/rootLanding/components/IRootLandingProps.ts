import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface IRootLandingProps {
  title: string;
  description: string;
  servicesTitle: string;
  servicesDescription: string;
  isDarkTheme: boolean;
  environmentMessage: string;
  hasTeamsContext: boolean;
  userDisplayName: string;
  context: WebPartContext;
}
