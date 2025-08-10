// Centralized list of nationalities for use across forms
// Format: { value, label } and kept alphabetical for easier scan

export type NationalityOption = { value: string; label: string };

export const NATIONALITIES: NationalityOption[] = [
  { value: "Malaysian", label: "Malaysian" },
  { value: "Singaporean", label: "Singaporean" },
  { value: "American", label: "American" },
  { value: "Australian", label: "Australian" },
  { value: "Bangladeshi", label: "Bangladeshi" },
  { value: "British", label: "British" },
  { value: "Bruneian", label: "Bruneian" },
  { value: "Cambodian", label: "Cambodian" },
  { value: "Canadian", label: "Canadian" },
  { value: "Chinese", label: "Chinese" },
  { value: "Filipino", label: "Filipino" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
  { value: "Indonesian", label: "Indonesian" },
  { value: "Indian", label: "Indian" },
  { value: "Italian", label: "Italian" },
  { value: "Japanese", label: "Japanese" },
  { value: "Korean", label: "Korean" },
  { value: "Laotian", label: "Laotian" },
  { value: "Myanmarese", label: "Myanmarese" },
  { value: "Nepalese", label: "Nepalese" },
  { value: "Pakistani", label: "Pakistani" },
  { value: "Sri Lankan", label: "Sri Lankan" },
  { value: "Taiwanese", label: "Taiwanese" },
  { value: "Thai", label: "Thai" },
  { value: "Turkish", label: "Turkish" },
  { value: "Vietnamese", label: "Vietnamese" },
  // The list can be expanded as needed. This subset covers common cases in the region.
];


