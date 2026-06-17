create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);