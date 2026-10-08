-- DEMO DATA. Run after schema.sql. Seed "alumni" are fictional demo users so the network has content.
insert into groups (slug, name, description, email_domain) values
 ('booth-mba', 'Chicago Booth MBA', 'Reviews from Booth students & alumni. Requires a @chicagobooth.edu email.', 'chicagobooth.edu'),
 ('uchicago', 'UChicago Community', 'Students, faculty and staff across campus. Requires a @uchicago.edu email.', 'uchicago.edu')
on conflict do nothing;

insert into profiles (id, full_name, instagram, city) values
 ('00000000-0000-0000-0000-0000000000a1','Maya Patel','maya.patel','Chicago'),
 ('00000000-0000-0000-0000-0000000000a2','Daniel Okafor','dan.okafor','Chicago'),
 ('00000000-0000-0000-0000-0000000000a3','Sofia Reyes','sofiareyes','Chicago'),
 ('00000000-0000-0000-0000-0000000000a4','James Whitfield','jwhitfield','Chicago'),
 ('00000000-0000-0000-0000-0000000000a5','Priya Nair','priya.nair','Chicago'),
 ('00000000-0000-0000-0000-0000000000a6','Lucas Moreau','lucasmoreau','Chicago'),
 ('00000000-0000-0000-0000-0000000000a7','Hannah Kim','hannahkim','Chicago'),
 ('00000000-0000-0000-0000-0000000000a8','Tomás Ibarra','tomas.ibarra','Chicago')
on conflict do nothing;

insert into group_members (group_id, user_id)
select g.id, p.id from groups g, profiles p
where g.slug = 'booth-mba' and p.id::text like '00000000-0000-0000-0000-0000000000a%'
on conflict do nothing;
insert into group_members (group_id, user_id)
select g.id, p.id from groups g, profiles p
where g.slug = 'uchicago' and p.id in ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-0000000000a5','00000000-0000-0000-0000-0000000000a7')
on conflict do nothing;

insert into providers (id, company, contact_name, category, city, regions, description, phone, email) values
 ('10000000-0000-0000-0000-000000000001','Windy City Maids','Rosa Alvarez','cleaning','Chicago','{Chicago,Evanston}','Family-run team doing recurring and move-out cleans across the North Side. Eco-friendly supplies included.','(312) 555-0141','hello@windycitymaids.example'),
 ('10000000-0000-0000-0000-000000000002','SparkLoop Cleaning','Ben Carter','cleaning','Chicago','{Chicago}','Deep cleans and apartment turnovers, same-week availability. Great for Hyde Park and South Loop.','(312) 555-0172','book@sparkloop.example'),
 ('10000000-0000-0000-0000-000000000003','Lakeview Fresh Home','Marta Nowak','cleaning','Chicago','{Chicago,Oak Park}','Weekly and bi-weekly home cleaning with a consistent assigned cleaner.','(773) 555-0118','team@lakeviewfresh.example'),
 ('10000000-0000-0000-0000-000000000004','Second City Movers','Andre Brooks','moving','Chicago','{Chicago,Evanston,Oak Park}','Careful local movers with transparent hourly rates. Studios to 3-bedrooms.','(312) 555-0190','move@secondcitymovers.example'),
 ('10000000-0000-0000-0000-000000000005','FixIt Frank','Frank Delgado','moving','Chicago','{Chicago}','Handyman for furniture assembly, mounting, small repairs. Fast response.','(773) 555-0133','frank@fixitfrank.example'),
 ('10000000-0000-0000-0000-000000000006','Two Guys & a Dolly','Chris & Miguel','moving','Chicago','{Chicago,Oak Park}','Affordable small-move specialists: one-bedroom, one afternoon.','(312) 555-0166','hi@twoguysdolly.example'),
 ('10000000-0000-0000-0000-000000000007','Happy Paws Chicago','Elena Rossi','dog-walking','Chicago','{Chicago}','Daily walks, group adventures and overnight sitting. Insured, background-checked walkers.','(312) 555-0107','woof@happypaws.example'),
 ('10000000-0000-0000-0000-000000000008','Loop Leash Co.','Sam Tran','dog-walking','Chicago','{Chicago}','Midday walks for downtown professionals, with photo updates.','(312) 555-0155','sam@loopleash.example'),
 ('10000000-0000-0000-0000-000000000009','Evanston Pet Pals','Dana Frost','dog-walking','Evanston','{Evanston,Chicago}','Neighborhood pet care by local students and professionals.','(847) 555-0121','pals@evanstonpets.example'),
 ('10000000-0000-0000-0000-000000000010','Bright Beginnings Nannies','Olivia Grant','child-care','Chicago','{Chicago,Evanston}','Vetted nannies and babysitters, CPR-certified. Short-notice evenings available.','(312) 555-0188','care@brightbeginnings.example'),
 ('10000000-0000-0000-0000-000000000011','Little Sprouts Sitters','Nadia Haddad','child-care','Chicago','{Chicago}','University-student sitters for date nights and weekends.','(773) 555-0129','book@littlesprouts.example'),
 ('10000000-0000-0000-0000-000000000012','After-School Allies','Marcus Lee','child-care','Oak Park','{Oak Park,Chicago}','Pickup, homework help, and activities for school-age kids.','(708) 555-0114','info@afterschoolallies.example')
on conflict do nothing;

insert into reviews (provider_id, user_id, rating, comment) values
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000a1',5,'Rosa''s team is incredible. Apartment looked brand new after move-out.'),
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000a3',5,'Reliable every other week, never a no-show.'),
 ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-0000000000a5',4,'Great quality, a bit pricey but worth it.'),
 ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-0000000000a2',4,'Good deep clean, communicative.'),
 ('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-0000000000a6',3,'Fine, but arrived late once.'),
 ('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-0000000000a4',5,'Same cleaner every time. Trustworthy with keys.'),
 ('10000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-0000000000a7',4,'Consistent and kind.'),
 ('10000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-0000000000a2',5,'Moved a 2BR in 4 hours, nothing broken. Highly recommend.'),
 ('10000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-0000000000a8',5,'Honest quote, final bill matched.'),
 ('10000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-0000000000a1',4,'Professional crew.'),
 ('10000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-0000000000a3',5,'Frank mounted my TV and built the whole IKEA wardrobe in an hour.'),
 ('10000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-0000000000a6',4,'Quick and fair.'),
 ('10000000-0000-0000-0000-000000000006','00000000-0000-0000-0000-0000000000a4',3,'Cheap but a little disorganized.'),
 ('10000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-0000000000a5',5,'My dog adores Elena. Daily photo updates are the best.'),
 ('10000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-0000000000a7',5,'Super responsive, great with anxious dogs.'),
 ('10000000-0000-0000-0000-000000000007','00000000-0000-0000-0000-0000000000a1',4,'Reliable.'),
 ('10000000-0000-0000-0000-000000000008','00000000-0000-0000-0000-0000000000a2',4,'Perfect for long workdays downtown.'),
 ('10000000-0000-0000-0000-000000000009','00000000-0000-0000-0000-0000000000a8',4,'Friendly sitters, flexible schedule.'),
 ('10000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-0000000000a3',5,'Our nanny has been with us for a year. Fantastic vetting process.'),
 ('10000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-0000000000a5',5,'Trustworthy and warm.'),
 ('10000000-0000-0000-0000-000000000010','00000000-0000-0000-0000-0000000000a6',4,'Expensive, but peace of mind.'),
 ('10000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-0000000000a7',4,'Great for date nights.'),
 ('10000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-0000000000a4',3,'Good but limited availability.'),
 ('10000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-0000000000a8',5,'Kids love Marcus. Great homework help.')
on conflict do nothing;
