import {
  Camera,
  Check,
  Globe,
  KeyRound,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { userService } from "../services/user.service";
import { authService } from "../services/auth.service";
import { mediaUrl } from "../lib/media";

const EMPTY_FORM = {
  fullname: "",
  username: "",
  email: "",
  phone: "",
  bio: "",
  location: "",
  website: "",
  dateOfBirth: "",
};

const EMPTY_PASSWORD = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function Profile() {
  const { user, setUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [imageBusy, setImageBusy] = useState(null);
  const [passwordBusy, setPasswordBusy] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [password, setPassword] = useState(EMPTY_PASSWORD);

  /*
   * Populate profile form whenever user data changes.
   */
  useEffect(() => {
    if (!user) return;

    setForm({
      fullname: user.fullname || "",
      username: user.username || "",
      email: user.email || "",
      phone: user.phone || user.contactNumber || "",
      bio: user.bio || "",
      location: user.location || "",
      website: user.website || "",
      dateOfBirth: user.dateOfBirth
        ? String(user.dateOfBirth).slice(0, 10)
        : "",
    });
  }, [user]);

  /*
   * Calculate profile completion.
   */
  const profileCompletion = useMemo(() => {
    const fields = [
      form.fullname,
      form.username,
      form.email,
      form.phone,
      form.bio,
      form.location,
      form.website,
      form.dateOfBirth,
    ];

    const completed = fields.filter((field) => field?.trim()).length;

    return Math.round((completed / fields.length) * 100);
  }, [form]);

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /*
   * Cancel editing and restore original user values.
   */
  const handleCancelEdit = () => {
    if (!user) return;

    setForm({
      fullname: user.fullname || "",
      username: user.username || "",
      email: user.email || "",
      phone: user.phone || user.contactNumber || "",
      bio: user.bio || "",
      location: user.location || "",
      website: user.website || "",
      dateOfBirth: user.dateOfBirth
        ? String(user.dateOfBirth).slice(0, 10)
        : "",
    });

    setIsEditing(false);
  };

  /*
   * Save profile information.
   */
  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!form.fullname.trim()) {
      toast.error("Channel name is required");
      return;
    }

    if (!form.username.trim()) {
      toast.error("Username is required");
      return;
    }

    if (!form.email.trim()) {
      toast.error("Email is required");
      return;
    }

    setBusy(true);

    try {
      const payload = {
        fullname: form.fullname.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        bio: form.bio.trim(),
        location: form.location.trim(),
        website: form.website.trim(),
        dateOfBirth: form.dateOfBirth || null,
      };

      const response = await userService.updateAccount(payload);

      /*
       * Depending on your API response wrapper,
       * user may be inside response.data.data or response.data.
       */
      const updatedUser = response?.data?.data || response?.data || response;

      setUser(updatedUser);

      setIsEditing(false);

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Profile update error:", error);

      toast.error(error?.response?.data?.message || "Unable to update profile");
    } finally {
      setBusy(false);
    }
  };

  /*
   * Update avatar / cover image.
   */
  const handleImageUpdate = async (type, file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }

    setImageBusy(type);

    try {
      const fd = new FormData();

      fd.append(type, file);

      const response =
        type === "avatar"
          ? await userService.updateAvatar(fd)
          : await userService.updateCover(fd);

      const updatedUser = response?.data?.data || response?.data || response;

      setUser(updatedUser);

      toast.success(
        type === "avatar" ? "Profile photo updated" : "Cover image updated",
      );
    } catch (error) {
      console.error("Image update error:", error);

      toast.error(error?.response?.data?.message || "Unable to update image");
    } finally {
      setImageBusy(null);
    }
  };

  /*
   * Change password.
   */
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!password.oldPassword) {
      toast.error("Enter your current password");
      return;
    }

    if (!password.newPassword) {
      toast.error("Enter a new password");
      return;
    }

    if (password.newPassword.length < 8) {
      toast.error("New password must contain at least 8 characters");
      return;
    }

    if (password.newPassword !== password.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setPasswordBusy(true);

    try {
      await authService.changePassword(password);

      setPassword(EMPTY_PASSWORD);

      toast.success("Password changed successfully");
    } catch (error) {
      console.error("Password change error:", error);

      toast.error(
        error?.response?.data?.message || "Unable to change password",
      );
    } finally {
      setPasswordBusy(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="mx-auto max-w-4xl">
          <div className="card p-10 text-center">
            <p className="text-slate-400">Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-5xl">
        {/* =====================================================
            PAGE HEADER
        ====================================================== */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">
              Account Settings
            </p>

            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Your Profile
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
              Manage your channel identity, personal information, contact
              details and account security.
            </p>
          </div>

          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="btn-primary self-start sm:self-auto"
            >
              <Pencil size={16} />
              Edit profile
            </button>
          ) : (
            <div className="flex gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={busy}
                className="btn-secondary"
              >
                <X size={16} />
                Cancel
              </button>

              <button
                type="submit"
                form="profile-form"
                disabled={busy}
                className="btn-primary"
              >
                <Save size={16} />
                {busy ? "Saving..." : "Save changes"}
              </button>
            </div>
          )}
        </div>

        {/* =====================================================
    PROFILE HERO
====================================================== */}
        <section className="relative min-h-[470px] overflow-hidden rounded-3xl border border-white/10 shadow-2xl">
          {/* Full Cover Background */}
          {user.coverImage ? (
            <img
              src={mediaUrl(user.coverImage)}
              alt="Profile cover"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-brand/90 via-[#571014] to-[#151515]" />
          )}

          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-black/45" />

          {/* Bottom gradient */}
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

          {/* Change Cover */}
          <label
            className={`absolute right-5 top-5 z-20 flex cursor-pointer items-center gap-2 rounded-xl border border-white/15 bg-black/60 px-4 py-2.5 text-xs font-bold text-white backdrop-blur-md transition hover:bg-black/80 ${
              imageBusy === "coverImage" ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <Camera size={16} />

            {imageBusy === "coverImage" ? "Uploading..." : "Change cover"}

            <input
              className="hidden"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={imageBusy === "coverImage"}
              onChange={(e) =>
                handleImageUpdate("coverImage", e.target.files?.[0])
              }
            />
          </label>

          {/* Profile Content */}
          <div className="relative z-10 flex min-h-[470px] flex-col justify-end px-5 pb-7 pt-28 sm:px-8">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
              {/* Avatar + Identity */}
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={mediaUrl(user.avatar)}
                    alt={user.fullname || user.username}
                    className="h-28 w-28 rounded-3xl border-[5px] border-black/70 bg-[#181818] object-cover shadow-2xl sm:h-32 sm:w-32"
                  />

                  {/* Avatar camera */}
                  <label
                    className={`absolute -bottom-2 -right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border-4 border-black/70 bg-brand text-white shadow-lg transition hover:bg-red-500 ${
                      imageBusy === "avatar"
                        ? "pointer-events-none opacity-60"
                        : ""
                    }`}
                  >
                    <Camera size={16} />

                    <input
                      className="hidden"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      disabled={imageBusy === "avatar"}
                      onChange={(e) =>
                        handleImageUpdate("avatar", e.target.files?.[0])
                      }
                    />
                  </label>
                </div>

                {/* User Details */}
                <div className="pb-1">
                  <h2 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-3xl">
                    {user.fullname || user.username}
                  </h2>

                  <p className="mt-1 text-sm text-slate-200/90">
                    @{user.username}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-red-400/30 bg-red-500/20 px-3 py-1.5 text-[11px] font-bold text-red-200 backdrop-blur-md">
                      Creator
                    </span>

                    {user.email && (
                      <span className="rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-[11px] font-medium text-slate-200 backdrop-blur-md">
                        Verified account
                      </span>
                    )}

                    {user.location && (
                      <span className="rounded-full border border-white/20 bg-black/30 px-3 py-1.5 text-[11px] text-slate-200 backdrop-blur-md">
                        📍 {user.location}
                      </span>
                    )}
                  </div>

                  {/* Bio */}
                  {user.bio && (
                    <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-200 drop-shadow-md">
                      {user.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* Profile Completion */}
              <div className="w-full max-w-xs rounded-2xl border border-white/15 bg-black/40 p-4 shadow-xl backdrop-blur-xl lg:w-64">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">
                    Profile completion
                  </span>

                  <span className="text-sm font-extrabold text-red-400">
                    {profileCompletion}%
                  </span>
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-brand transition-all duration-500"
                    style={{
                      width: `${profileCompletion}%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-[11px] leading-relaxed text-slate-300/70">
                  Complete your profile to help people discover you.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            PROFILE INFORMATION
        ====================================================== */}
        <form
          id="profile-form"
          onSubmit={handleSaveProfile}
          className="mt-6 space-y-6"
        >
          <section className="card overflow-hidden">
            <div className="border-b border-white/10 px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-brand/15 p-2.5 text-brand">
                  <User size={19} />
                </span>

                <div>
                  <h2 className="font-extrabold text-white">
                    Channel information
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Your public creator identity
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-6 sm:grid-cols-2">
              {/* Channel name */}
              <ProfileField
                label="Channel name"
                value={form.fullname}
                editing={isEditing}
                onChange={(value) => updateField("fullname", value)}
                placeholder="Your channel name"
                icon={User}
                required
              />

              {/* Username */}
              <ProfileField
                label="Username"
                value={form.username}
                editing={isEditing}
                onChange={(value) => updateField("username", value)}
                placeholder="username"
                prefix="@"
                icon={User}
                required
              />

              {/* Bio */}
              <div className="sm:col-span-2">
                <ProfileLabel label="Bio" icon={Pencil} />

                {isEditing ? (
                  <>
                    <textarea
                      value={form.bio}
                      onChange={(e) => updateField("bio", e.target.value)}
                      maxLength={500}
                      rows={4}
                      placeholder="Tell people a little about yourself..."
                      className="input mt-2 min-h-[110px] resize-none"
                    />

                    <p className="mt-1 text-right text-[11px] text-slate-500">
                      {form.bio.length}/500
                    </p>
                  </>
                ) : (
                  <p className="mt-2 min-h-10 text-sm text-slate-300">
                    {form.bio || "No bio added yet."}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* =================================================
              CONTACT INFORMATION
          ================================================== */}
          <section className="card overflow-hidden">
            <div className="border-b border-white/10 px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-blue-500/10 p-2.5 text-blue-400">
                  <Mail size={19} />
                </span>

                <div>
                  <h2 className="font-extrabold text-white">
                    Contact information
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Keep your account details up to date
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <ProfileField
                label="Email address"
                value={form.email}
                editing={isEditing}
                onChange={(value) => updateField("email", value)}
                placeholder="you@example.com"
                icon={Mail}
                type="email"
                required
              />

              <ProfileField
                label="Contact number"
                value={form.phone}
                editing={isEditing}
                onChange={(value) => updateField("phone", value)}
                placeholder="+91 00000 00000"
                icon={Phone}
                type="tel"
              />

              <ProfileField
                label="Location"
                value={form.location}
                editing={isEditing}
                onChange={(value) => updateField("location", value)}
                placeholder="City, Country"
                icon={MapPin}
              />

              <ProfileField
                label="Website"
                value={form.website}
                editing={isEditing}
                onChange={(value) => updateField("website", value)}
                placeholder="https://yourwebsite.com"
                icon={Globe}
                type="url"
              />

              <ProfileField
                label="Date of birth"
                value={form.dateOfBirth}
                editing={isEditing}
                onChange={(value) => updateField("dateOfBirth", value)}
                icon={User}
                type="date"
              />
            </div>
          </section>
        </form>

        {/* =====================================================
            ACCOUNT SECURITY
        ====================================================== */}
        <section className="card mt-6 overflow-hidden">
          <div className="border-b border-white/10 px-6 py-5">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-400">
                <ShieldCheck size={19} />
              </span>

              <div>
                <h2 className="font-extrabold text-white">Account security</h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Protect your Streamline account
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <span className="rounded-xl bg-brand/10 p-2.5 text-brand">
                <KeyRound size={18} />
              </span>

              <div>
                <p className="text-sm font-bold text-white">Change password</p>

                <p className="text-xs text-slate-500">
                  Use a unique password with at least 8 characters.
                </p>
              </div>
            </div>

            <form
              onSubmit={handlePasswordChange}
              className="grid gap-4 sm:grid-cols-3"
            >
              <PasswordInput
                placeholder="Current password"
                value={password.oldPassword}
                onChange={(value) =>
                  setPassword((prev) => ({
                    ...prev,
                    oldPassword: value,
                  }))
                }
              />

              <PasswordInput
                placeholder="New password"
                value={password.newPassword}
                onChange={(value) =>
                  setPassword((prev) => ({
                    ...prev,
                    newPassword: value,
                  }))
                }
              />

              <PasswordInput
                placeholder="Confirm new password"
                value={password.confirmPassword}
                onChange={(value) =>
                  setPassword((prev) => ({
                    ...prev,
                    confirmPassword: value,
                  }))
                }
              />

              <div className="flex justify-end sm:col-span-3">
                <button
                  type="submit"
                  disabled={passwordBusy}
                  className="btn-secondary"
                >
                  <KeyRound size={15} />

                  {passwordBusy ? "Updating..." : "Update password"}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* =====================================================
            ACCOUNT DETAILS
        ====================================================== */}
        <section className="mt-6 mb-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-lg bg-white/5 p-2 text-slate-400">
              <ShieldCheck size={16} />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-300">
                Account information
              </p>

              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Your username is used to identify your public channel. Some
                account information may require verification before it can be
                changed.
              </p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

/* ============================================================
   PROFILE FIELD
============================================================ */

function ProfileField({
  label,
  value,
  editing,
  onChange,
  placeholder,
  icon: Icon,
  type = "text",
  prefix,
  required = false,
}) {
  return (
    <div>
      <ProfileLabel label={label} icon={Icon} required={required} />

      {editing ? (
        <div className="relative mt-2">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
              {prefix}
            </span>
          )}

          <input
            className={`input ${prefix ? "pl-7" : ""}`}
            type={type}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      ) : (
        <div className="mt-2 flex min-h-10 items-center rounded-xl border border-transparent bg-white/[0.02] px-3 text-sm text-slate-300">
          {prefix && <span className="mr-0.5 text-slate-500">{prefix}</span>}

          {value || <span className="text-slate-600">Not provided</span>}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   PROFILE LABEL
============================================================ */

function ProfileLabel({ label, icon: Icon, required = false }) {
  return (
    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
      {Icon && <Icon size={13} className="text-slate-500" />}

      {label}

      {required && <span className="text-brand">*</span>}
    </label>
  );
}

/* ============================================================
   PASSWORD INPUT
============================================================ */

function PasswordInput({ placeholder, value, onChange }) {
  return (
    <input
      className="input"
      type="password"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      autoComplete="new-password"
    />
  );
}
