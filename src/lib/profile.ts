import type { ProfileDanceRole, ProfileGender } from "@/types/database";

export type ProfileFormValues = {
  fullName: string;
  bio: string;
  gender: ProfileGender | "";
  danceRole: ProfileDanceRole | "";
  age: string;
};

export const EMPTY_PROFILE_FORM_VALUES: ProfileFormValues = {
  fullName: "",
  bio: "",
  gender: "",
  danceRole: "",
  age: "",
};

export function profileToFormValues(profile: {
  full_name: string;
  bio: string | null;
  gender: ProfileGender | null;
  dance_role: ProfileDanceRole | null;
  age: number | null;
}): ProfileFormValues {
  return {
    fullName: profile.full_name ?? "",
    bio: profile.bio ?? "",
    gender: profile.gender ?? "",
    danceRole: profile.dance_role ?? "",
    age: profile.age?.toString() ?? "",
  };
}
