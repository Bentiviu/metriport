import { Facility } from "../../../domain/medical/facility";
import { FacilityModel } from "../../../models/medical/facility";
import { validateVersionForUpdate } from "../../../models/_default";
import { BaseUpdateCmdWithCustomer } from "../base-update-command";
import { validateCreate } from "./create-facility";
import { getFacilityOrFail } from "./get-facility";

type PartialProps =
  | "eTag"
  | "cqType"
  | "cwType"
  | "cqActive"
  | "cwActive"
  | "cqOboOid"
  | "cwOboOid";

export type FacilityUpdateCmd = BaseUpdateCmdWithCustomer &
  Omit<Facility, "oid" | "facilityNumber" | "createdAt" | "updatedAt" | PartialProps> &
  Partial<Pick<Facility, PartialProps>>;

export const updateFacility = async (facilityUpdate: FacilityUpdateCmd): Promise<FacilityModel> => {
  const { id, cxId, eTag } = facilityUpdate;

  const facility = await getFacilityOrFail({ id, cxId });
  validateVersionForUpdate(facility, eTag);

  const { data, cqActive, cwActive, cqOboOid, cwOboOid } = validateUpdate(facility, facilityUpdate);
  const { name, npi, tin, active, address } = data;

  return facility.update({
    data: {
      name,
      npi,
      tin,
      active,
      address,
    },
    cqActive,
    cwActive,
    cqOboOid,
    cwOboOid,
  });
};

export function validateUpdate(existing: Facility, updateFac: FacilityUpdateCmd): Facility {
  const cqType = updateFac.cqType ?? existing.cqType;
  const cwType = updateFac.cwType ?? existing.cwType;
  const cqActive = updateFac.cqActive ?? existing.cqActive;
  const cwActive = updateFac.cwActive ?? existing.cwActive;
  const cqOboOid = updateFac.cqOboOid === undefined ? existing.cqOboOid : updateFac.cqOboOid;
  const cwOboOid = updateFac.cwOboOid === undefined ? existing.cwOboOid : updateFac.cwOboOid;

  const result = {
    ...existing,
    ...updateFac,
    cqType,
    cwType,
    cqActive,
    cwActive,
    cqOboOid,
    cwOboOid,
  };
  validateCreate(result);
  return result;
}
