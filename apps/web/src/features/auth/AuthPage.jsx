import { useId, useMemo, useState } from "react";
import { login } from "./auth.api";

const AUTH_CONTENT = Object.freeze({
  eyebrow: "Admin Control Center",
  title: "Welcome back",
  description: "Sign in to securely manage users, analytics, permissions, and platform operations.",
});
const INITIAL_FORM = Object.freeze({
  email: "",
  password: "",
  remember: true,
});

const FEATURES = Object.freeze([
  { title: "Secure access", description: "Protected authentication and session handling." },
  { title: "Operational clarity", description: "Monitor critical platform activity in one place." },
  { title: "Role-based control", description: "Manage users, permissions, and administrative access." },
]);

const normalizeError = (error) => {
  const message =
    error?.response?.data?.message ??
    error?.message ??
    "Unable to sign in. Please check your credentials and try again.";
  return Array.isArray(message) ? message[0] : String(message);
};

const validateForm = ({ email, password }) => {
  const errors = {};
  const normalizedEmail = email.trim();
  if (!normalizedEmail) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) errors.password = "Password is required.";
  else if (password.length < 8) {
    errors.password = "Password must contain at least 8 characters.";
  }

  return errors;
};
const FieldError = ({ id, message }) =>
  message ? (
    <p id={id} role="alert" className="mt-1.5 text-xs font-medium text-rose-600">
      {message}
    </p>
  ) : null;

const BrandMark = () => (
  <div className="flex items-center gap-3">
    <span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-sm font-black text-white shadow-lg shadow-indigo-600/20">
      A
    </span>
    <div>
      <p className="text-sm font-bold tracking-tight text-slate-950">Apex Admin</p>
      <p className="text-xs text-slate-500">Enterprise operations</p>
    </div>
  </div>
);

const AuthPage = () => {
  const emailId = useId();
  const passwordId = useId();
  const emailErrorId = `${emailId}-error`;
  const passwordErrorId = `${passwordId}-error`;
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [requestError, setRequestError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const fieldConfig = useMemo(
    () => [
      {
        id: emailId,
        name: "email",
        label: "Work email",
        type: "email",
        value: form.email,
        placeholder: "admin@company.com",
        autoComplete: "email",
        error: errors.email,
        errorId: emailErrorId,
      },
      {
        id: passwordId,
        name: "password",
        label: "Password",
        type: showPassword ? "text" : "password",
        value: form.password,
        placeholder: "Enter your password",
        autoComplete: "current-password",
        error: errors.password,
        errorId: passwordErrorId,
      },
    ],
    [
      emailErrorId,
      emailId,
      errors.email,
      errors.password,
      form.email,
      form.password,
      passwordErrorId,
      passwordId,
      showPassword,
    ],
  );
  const updateField = ({ target: { name, type, value, checked } }) => {
    const nextValue = type === "checkbox" ? checked : value;
    setForm((current) => ({ ...current, [name]: nextValue }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setRequestError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setRequestError("");
    try {
      const credentials = {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        remember: form.remember,
      };

      const session = await Promise.resolve(login(credentials));
      const destination = session?.redirectTo ?? "/dashboard";
      window.location.assign(destination);
    } catch (error) {
      setRequestError(normalizeError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 lg:grid lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden border-r border-white/10 p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,.28),transparent_42%)]" />
        <div className="absolute -bottom-40 -left-32 size-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3 text-white">
            <span className="grid size-10 place-items-center rounded-xl bg-white text-sm font-black text-slate-950">
              A
            </span>
            <span className="text-sm font-bold tracking-wide">APEX ADMIN</span>
          </div>
        </div>
        <div className="relative max-w-xl">
          <p className="mb-5 text-xs font-bold uppercase tracking-[.22em] text-indigo-300">
            Enterprise administration
          </p>
          <h1 className="text-4xl font-black leading-tight tracking-tight text-white xl:text-5xl">
            Operate your platform with confidence.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
            A secure workspace designed for high-impact teams managing complex products, users, and business operations.
          </p>
          <div className="mt-10 grid gap-3">
            {FEATURES.map(({ title, description }) => (
              <article
                key={title}
                className="flex gap-4 rounded-2xl border border-white/10 bg-white/[.04] p-4 backdrop-blur"
              >
                <span className="mt-1 grid size-6 shrink-0 place-items-center rounded-full bg-indigo-400/15 text-xs font-black text-indigo-300">
                  ✓
                </span>
                <div>
                  <h2 className="text-sm font-bold text-white">{title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-slate-500">
          Protected by enterprise-grade authentication controls.
        </p>
      </section>
      <section className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-8 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <BrandMark />
          </div>
          <header className="mb-7">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-indigo-600">
              {AUTH_CONTENT.eyebrow}
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              {AUTH_CONTENT.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {AUTH_CONTENT.description}
            </p>
          </header>
          <form noValidate onSubmit={handleSubmit} className="space-y-5">
            {requestError ? (
              <div
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
              >
                {requestError}
              </div>
            ) : null}

            {fieldConfig.map((field) => (
              <div key={field.name}>
                <div className="flex items-center justify-between">
                  <label htmlFor={field.id} className="text-sm font-bold text-slate-800">
                    {field.label}
                  </label>
                  {field.name === "password" ? (
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="text-xs font-bold text-indigo-600 outline-none hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  ) : null}
                </div>

                <input
                  id={field.id}
                  name={field.name}
                  type={field.type}
                  value={field.value}
                  placeholder={field.placeholder}
                  autoComplete={field.autoComplete}
                  onChange={updateField}
                  disabled={isSubmitting}
                  aria-invalid={Boolean(field.error)}
                  aria-describedby={field.error ? field.errorId : undefined}
                  className="mt-2 h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
                <FieldError id={field.errorId} message={field.error} />
              </div>
            ))}
            <div className="flex items-center justify-between gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-600">
                <input
                  name="remember"
                  type="checkbox"
                  checked={form.remember}
                  onChange={updateField}
                  disabled={isSubmitting}
                  className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Keep me signed in
              </label>

              <a
                href="/forgot-password"
                className="text-sm font-bold text-indigo-600 outline-none hover:text-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2 size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in...
                </>
              ) : (
                "Sign in securely"
              )}
            </button>
          </form>
          <footer className="mt-8 border-t border-slate-200 pt-6 text-center">
            <p className="text-xs leading-5 text-slate-500">
              By continuing, you agree to the platform security and acceptable-use policies.
            </p>
          </footer>
        </div>
      </section>
    </main>
  );
};

export default AuthPage;
