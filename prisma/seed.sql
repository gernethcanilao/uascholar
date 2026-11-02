-- Initial UA scholarships and grants. Run with: npm run db:seed
-- NOTE: benefits / eligibility / process text below are PLACEHOLDERS.
-- Replace them with the official details from the UA Scholarship Office
-- (easiest via Admin > Scholarships in the app).

insert into public.scholarships (slug, name, category, summary, benefits, eligibility, application_process, required_documents)
values
('academic-scholarship', 'Academic Scholarship', 'Academic',
 'For students with outstanding academic performance.',
 array['Tuition fee discount based on academic standing'],
 array['Currently enrolled at the University of the Assumption', 'Meets the required general weighted average (GWA)', 'No failing or incomplete grades', 'Good moral standing'],
 array['Complete your student profile', 'Check the eligibility requirements', 'Submit the online application with documents', 'Wait for the review of the Scholarship Office'],
 array['Copy of latest grades', 'Certificate of good moral character']),

('ua-archdiocesan-grant', 'UA and Archdiocesan Grant', 'Grant',
 'Financial assistance supported by the University and the Archdiocese.',
 array['Partial tuition fee assistance'],
 array['Currently enrolled at the University of the Assumption', 'Recommendation from the parish (if required)', 'Good moral standing'],
 array['Complete your student profile', 'Submit the online application with documents', 'Attend the interview if scheduled'],
 array['Parish recommendation letter', 'Proof of family income']),

('cinense-grant', 'Cinense Grant', 'Grant',
 'Grant for qualified students under the Cinense program.',
 array['Tuition fee assistance'],
 array['Currently enrolled at the University of the Assumption', 'Meets the program requirements'],
 array['Complete your student profile', 'Submit the online application with documents'],
 array['Proof of residency', 'Copy of latest grades']),

('guerrero-grant', 'Guerrero Grant', 'Grant',
 'Grant for qualified students under the Guerrero program.',
 array['Tuition fee assistance'],
 array['Currently enrolled at the University of the Assumption', 'Meets the program requirements'],
 array['Complete your student profile', 'Submit the online application with documents'],
 array['Proof of family income', 'Copy of latest grades']),

('ua-yslep', 'UA YSLEP', 'Grant',
 'Grant for qualified members of the UA YSLEP program.',
 array['Tuition fee assistance'],
 array['Currently enrolled at the University of the Assumption', 'Active member of the program'],
 array['Complete your student profile', 'Submit the online application with documents'],
 array['Certificate of membership']),

('ua-chorale', 'UA Chorale', 'Talent',
 'For active members of the University Chorale.',
 array['Tuition fee discount for active members'],
 array['Currently enrolled at the University of the Assumption', 'Passed the Chorale audition', 'Active participation in performances'],
 array['Complete your student profile', 'Submit the online application with documents'],
 array['Certification from the Chorale moderator']),

('ua-dance-troupe', 'UA Dance Troupe', 'Talent',
 'For active members of the University Dance Troupe.',
 array['Tuition fee discount for active members'],
 array['Currently enrolled at the University of the Assumption', 'Passed the Dance Troupe audition', 'Active participation in performances'],
 array['Complete your student profile', 'Submit the online application with documents'],
 array['Certification from the Dance Troupe moderator']),

('ua-athletes', 'UA Athletes', 'Athletic',
 'For varsity athletes representing the University.',
 array['Tuition fee discount for varsity players'],
 array['Currently enrolled at the University of the Assumption', 'Official member of a UA varsity team', 'Meets academic eligibility for athletes'],
 array['Complete your student profile', 'Submit the online application with documents'],
 array['Certification from the coach / sports director'])
on conflict (slug) do nothing;
