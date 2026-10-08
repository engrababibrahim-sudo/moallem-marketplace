-- Allow a rejected teacher to resubmit after editing the profile.
-- Administrators remain the only users who can approve/reject/suspend.
create or replace function public.protect_teacher_fields()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  if not public.is_admin() and auth.uid() = old.id then
    if new.reviewed_by is distinct from old.reviewed_by
       or new.reviewed_at is distinct from old.reviewed_at then
      raise exception 'teacher review fields are managed by administrators';
    end if;

    if new.verification_status <> old.verification_status
       and not (old.verification_status = 'rejected' and new.verification_status = 'pending') then
      raise exception 'teacher verification status can only be changed by an administrator';
    end if;

    if old.verification_status = 'rejected' and new.verification_status = 'pending' then
      new.rejection_reason := null;
    elsif new.rejection_reason is distinct from old.rejection_reason then
      raise exception 'teacher rejection reason is managed by administrators';
    end if;
  end if;
  return new;
end;
$$;
