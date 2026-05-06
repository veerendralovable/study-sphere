import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { profileService } from "@/services/profileService";
import { avatarService } from "@/services/avatarService";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import { nameSchema, passwordSchema } from "@/lib/validation";
import { toast } from "sonner";
import { Upload, Trash2 } from "lucide-react";

export function ProfileDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    profileService.getById(user.id).then((p) => {
      setName(p?.name ?? "");
      setEmail(p?.email ?? user.email ?? "");
      setAvatar((p as any)?.avatar_url ?? null);
    });
  }, [open, user]);

  const save = async () => {
    if (!user) return;
    const parsed = nameSchema.safeParse(name);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    try {
      await profileService.updateName(user.id, parsed.data);
      toast.success("Profile updated");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async () => {
    if (!user) return;
    const parsed = passwordSchema.safeParse(pw);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (pw !== pw2) return toast.error("Passwords don't match");
    setPwBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      toast.success("Password updated");
      setPw("");
      setPw2("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPwBusy(false);
    }
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    const f = e.target.files[0];
    setBusy(true);
    try {
      const url = await avatarService.upload(user.id, f);
      setAvatar(url);
      toast.success("Avatar updated");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeAvatar = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await avatarService.clear(user.id);
      setAvatar(null);
      toast.success("Avatar removed");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const initials = (name || email || "U").slice(0, 1).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Your profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {avatar && <AvatarImage src={avatar} alt={name} />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={onPickFile}
              />
              <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={busy}>
                <Upload className="mr-2 h-4 w-4" /> Upload avatar
              </Button>
              {avatar && (
                <Button size="sm" variant="ghost" onClick={removeAvatar} disabled={busy}>
                  <Trash2 className="mr-2 h-4 w-4" /> Remove
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-name">Name</Label>
            <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          </div>
          <Button onClick={save} disabled={busy} className="w-full">
            {busy ? "Saving…" : "Save changes"}
          </Button>

          <div className="border-t border-border pt-4">
            <h3 className="mb-3 text-sm font-semibold">Change password</h3>
            <div className="space-y-2">
              <Input type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} />
              <Input type="password" placeholder="Confirm password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
              <Button variant="outline" onClick={changePassword} disabled={pwBusy || !pw} className="w-full">
                {pwBusy ? "Updating…" : "Update password"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
