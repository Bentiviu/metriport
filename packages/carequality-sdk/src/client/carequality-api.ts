import { Organization } from "../models/organization";

export interface CarequalityManagementAPI {
  listOrganizations({
    count,
    start,
    oid,
  }: {
    count?: number;
    start?: number;
    oid?: string;
  }): Promise<Organization[]>;
  registerOrganization(org: string): Promise<string>;
  updateOrganization(org: string, oid: string): Promise<string>;
}
