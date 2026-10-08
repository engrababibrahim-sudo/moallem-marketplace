create or replace function public.protect_profile_fields()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  if not public.is_admin() and auth.uid() = old.id then
    if new.role <> old.role or new.account_status <> old.account_status then
      raise exception 'profile role/status can only be changed by an administrator';
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_profile_fields before update on public.profiles
for each row execute function public.protect_profile_fields();

create or replace function public.protect_teacher_fields()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  if not public.is_admin() and auth.uid() = old.id then
    if new.verification_status <> old.verification_status
       or new.reviewed_by is distinct from old.reviewed_by
       or new.reviewed_at is distinct from old.reviewed_at
       or new.rejection_reason is distinct from old.rejection_reason then
      raise exception 'teacher verification fields are managed by administrators';
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_teacher_fields before update on public.teacher_profiles
for each row execute function public.protect_teacher_fields();

create or replace function public.protect_booking_fields()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  if not public.is_staff() and auth.uid() = old.student_id then
    if new.student_id <> old.student_id or new.teacher_id <> old.teacher_id
       or new.start_at <> old.start_at or new.end_at <> old.end_at
       or new.hourly_rate_snapshot is distinct from old.hourly_rate_snapshot
       or new.total_price is distinct from old.total_price
       or new.payment_status <> old.payment_status then
      raise exception 'booking ownership, schedule and payment fields are protected';
    end if;
  elsif not public.is_staff() and auth.uid() = old.teacher_id then
    if new.student_id <> old.student_id or new.teacher_id <> old.teacher_id
       or new.start_at <> old.start_at or new.end_at <> old.end_at
       or new.hourly_rate_snapshot is distinct from old.hourly_rate_snapshot
       or new.total_price is distinct from old.total_price
       or new.payment_status <> old.payment_status then
      raise exception 'booking ownership, schedule and payment fields are protected';
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_booking_fields before update on public.bookings
for each row execute function public.protect_booking_fields();
