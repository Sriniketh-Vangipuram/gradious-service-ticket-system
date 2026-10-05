import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createUser,
  updateUserPrimaryCenter,
  updateUserProfile,
  updateUserSpecializations,
  updateUserStatus,
  updateUserLab,
  type CreateUserRequest,
  type UpdateUserPrimaryCenterRequest,
  type UpdateUserProfileRequest,
  type UpdateUserSpecializationsRequest,
  type UpdateUserStatusRequest,
  type UpdateUserLabRequest,
} from "../api/userService";

import { USER_QUERY_KEYS } from "../api/user.keys";

/* -------------------------------------------------------------------------- */
/* Create user                                                                */
/* -------------------------------------------------------------------------- */

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserRequest) =>
      createUser(payload),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.lists(),
      });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Update user profile                                                        */
/* -------------------------------------------------------------------------- */

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: number;
      payload: UpdateUserProfileRequest;
    }) =>
      updateUserProfile(
        userId,
        payload,
      ),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.lists(),
      });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Update primary center                                                      */
/* -------------------------------------------------------------------------- */

export function useUpdateUserPrimaryCenter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: number;
      payload: UpdateUserPrimaryCenterRequest;
    }) =>
      updateUserPrimaryCenter(
        userId,
        payload,
      ),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.lists(),
      });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Update user status                                                         */
/* -------------------------------------------------------------------------- */

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: number;
      payload: UpdateUserStatusRequest;
    }) =>
      updateUserStatus(
        userId,
        payload,
      ),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.lists(),
      });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Update technician specializations                                          */
/* -------------------------------------------------------------------------- */

export function useUpdateUserSpecializations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      specializations,
    }: {
      userId: number;
      specializations: UpdateUserSpecializationsRequest["specializations"];
    }) =>
      updateUserSpecializations(
        userId,
        {
          specializations,
        },
      ),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.lists(),
      });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Update user lab                                                            */
/* -------------------------------------------------------------------------- */

export function useUpdateUserLab() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: number;
      payload: UpdateUserLabRequest;
    }) =>
      updateUserLab(
        userId,
        payload,
      ),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: USER_QUERY_KEYS.lists(),
      });
    },
  });
}