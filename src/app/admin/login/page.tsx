"use client";

import { useActionState } from "react";
import { loginAdmin, type LoginState } from "@/actions/auth-actions";

const initialState: LoginState = {};

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(loginAdmin, initialState);

  return (
    <main className="mx-auto max-w-sm px-4 py-16 w-full">
      <h1 className="text-xl font-bold mb-4">관리자 로그인</h1>
      <form action={action} className="space-y-3">
        <input
          type="password"
          name="password"
          placeholder="비밀번호"
          autoFocus
          className="w-full border rounded px-3 py-2"
        />
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full bg-blue-600 text-white rounded py-2 disabled:opacity-50"
        >
          {pending ? "확인 중..." : "로그인"}
        </button>
      </form>
    </main>
  );
}
