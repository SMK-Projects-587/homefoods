-- Backfill `keywords` on every product from the 2026-09-18 catalog reset
-- (20260918195202_catalog_reset.sql). That migration left keywords at the
-- column default ('{}') to keep the reset itself lean; this fills them in
-- as a small follow-up so search (products_set_search_vector, which weights
-- keywords equally with name) has real synonyms to match against, not just
-- the literal product name.

begin;

update public.products set keywords = array['chegodi', 'snack', 'చెగోడీలు'] where name = 'Chegodi';
update public.products set keywords = array['jantika', 'snack', 'జంతికలు'] where name = 'Jantika';
update public.products set keywords = array['chakkilam', 'snack', 'చక్కిలం'] where name = 'Chakkilam';
update public.products set keywords = array['ariselu', 'snack', 'అరిసెలు'] where name = 'Ariselu';
update public.products set keywords = array['gulabipuvvulu', 'snack', 'గులాబిపువ్వులు'] where name = 'Gulabipuvvulu';
update public.products set keywords = array['minapasunni', 'snack', 'మినపసున్ని'] where name = 'Minapasunni';
update public.products set keywords = array['appadam', 'fryums', 'hot', 'papad', 'vadiyalu', 'అప్పడం (హాట్)'] where name = 'Appadam (Hot)';
update public.products set keywords = array['appadam', 'fryums', 'hot', 'nuvvula', 'papad', 'vadiyalu', 'నువ్వుల అప్పడం (హాట్)'] where name = 'Nuvvula Appadam (Hot)';
update public.products set keywords = array['appadam', 'fryums', 'hot', 'medium', 'papad', 'vadiyalu', 'అప్పడం (మీడియం హాట్)'] where name = 'Appadam (Medium Hot)';
update public.products set keywords = array['appadam', 'fryums', 'hot', 'medium', 'nuvvula', 'papad', 'vadiyalu', 'నువ్వుల అప్పడం (మీడియం హాట్)'] where name = 'Nuvvula Appadam (Medium Hot)';
update public.products set keywords = array['appadam', 'fryums', 'hot', 'low', 'papad', 'vadiyalu', 'అప్పడం (తక్కువ కారం)'] where name = 'Appadam (Low Hot)';
update public.products set keywords = array['appadam', 'fryums', 'hot', 'low', 'nuvvula', 'papad', 'vadiyalu', 'నువ్వుల అప్పడం (తక్కువ కారం)'] where name = 'Nuvvula Appadam (Low Hot)';
update public.products set keywords = array['appadam', 'fryums', 'papad', 'pindi', 'vadiyalu', 'vari', 'వరిపిండి వడియాలు'] where name = 'Vari Pindi Vadiyalu';
update public.products set keywords = array['appadam', 'fryums', 'papad', 'pelapu', 'vadiyalu', 'పేలపు వడియాలు'] where name = 'Pelapu Vadiyalu';
update public.products set keywords = array['appadam', 'fryums', 'gummadi', 'papad', 'vadiyalu', 'గుమ్మడి వడియాలు'] where name = 'Gummadi Vadiyalu';
update public.products set keywords = array['appadam', 'fryums', 'papad', 'saggu', 'vadiyalu', 'vadiyam', 'సగ్గు వడియం'] where name = 'Saggu Vadiyam';
update public.products set keywords = array['appadam', 'fryums', 'papad', 'telagapindi', 'vadiyalu', 'vadiyam', 'తెలగపిండి వడియం'] where name = 'Telagapindi Vadiyam';
update public.products set keywords = array['appadam', 'fryums', 'koora', 'minapa', 'papad', 'vadiyalu', 'vadiyam', 'కూర వడియం (మినపవడియం)'] where name = 'Koora Vadiyam (Minapa)';
update public.products set keywords = array['appadam', 'chillis', 'curd', 'fryums', 'mirapakayalu', 'papad', 'perugu', 'vadiyalu', 'పెరుగు మిరపకాయలు'] where name = 'Perugu Mirapakayalu (Curd Chillis)';
update public.products set keywords = array['appadala', 'pindi', 'podi', 'powder', 'అప్పడాల పిండి'] where name = 'Appadala Pindi';
update public.products set keywords = array['idly', 'karam', 'podi', 'powder', 'ఇడ్లీ కారం'] where name = 'Idly Karam';
update public.products set keywords = array['kandi', 'podi', 'powder', 'కందిపొడి'] where name = 'Kandi Podi';
update public.products set keywords = array['nuvvula', 'podi', 'powder', 'నువ్వులపొడి'] where name = 'Nuvvula Podi';
update public.products set keywords = array['coconut', 'podi', 'powder', 'కొబ్బరిపొడి'] where name = 'Coconut Podi';
update public.products set keywords = array['podi', 'powder', 'telagapindi', 'తెలగపిండి పొడి'] where name = 'Telagapindi Podi';
update public.products set keywords = array['curry', 'leaf', 'podi', 'powder', 'కరివేపాకు పొడి'] where name = 'Curry Leaf Podi';
update public.products set keywords = array['podi', 'powder', 'sambar', 'సాంబారుపొడి'] where name = 'Sambar Powder';
update public.products set keywords = array['podi', 'powder', 'rasam', 'రసం పొడి'] where name = 'Rasam Powder';
update public.products set keywords = array['garam', 'masala', 'podi', 'powder', 'గరం మసాలా పొడి'] where name = 'Garam Masala Podi';
update public.products set keywords = array['achar', 'avakaya', 'bellam', 'pachadi', 'pickle', 'బెల్లం ఆవకాయ'] where name = 'Bellam Avakaya';
update public.products set keywords = array['achar', 'avakaya', 'karam', 'pachadi', 'pickle', 'కారం ఆవకాయ'] where name = 'Karam Avakaya';
update public.products set keywords = array['achar', 'avakaya', 'endu', 'pachadi', 'pickle', 'ఎండు ఆవకాయ'] where name = 'Endu Avakaya';
update public.products set keywords = array['achar', 'avakaya', 'full', 'kaya', 'mango', 'pachadi', 'palam', 'pickle', 'కాయపాళం ఆవకాయ'] where name = 'Kaya Palam Avakaya (Full Mango)';
update public.products set keywords = array['achar', 'chilly', 'fruit', 'pachadi', 'pandumirapa', 'pickle', 'పండుమిరప పచ్చడి'] where name = 'Pandumirapa Pachadi (Fruit Chilly)';
update public.products set keywords = array['achar', 'allam', 'ginger', 'pachadi', 'pickle', 'అల్లం పచ్చడి'] where name = 'Allam Pachadi (Ginger Pickle)';
update public.products set keywords = array['achar', 'dabbakaya', 'pachadi', 'pickle', 'దబ్బకాయ'] where name = 'Dabbakaya';
update public.products set keywords = array['achar', 'pachadi', 'pickle', 'velamkaya', 'వెలంకాయ పచ్చడి'] where name = 'Velamkaya Pachadi';
update public.products set keywords = array['achar', 'pachadi', 'pickle', 'tamota', 'tomato', 'టమాటా పచ్చడి'] where name = 'Tamota Pachadi (Tomato Pickle)';
update public.products set keywords = array['achar', 'gongura', 'pachadi', 'pickle', 'గోంగూర పచ్చడి'] where name = 'Gongura Pachadi';
update public.products set keywords = array['achar', 'lemon', 'nimmakaya', 'pachadi', 'pickle', 'నిమ్మకాయ పచ్చడి'] where name = 'Nimmakaya Pachadi (Lemon Pickle)';
update public.products set keywords = array['achar', 'amla', 'avakaya', 'full', 'pachadi', 'palam', 'pickle', 'usiri', 'ఉసిరి ఆవకాయ పాళం'] where name = 'Usiri Avakaya Palam (Amla Full)';
update public.products set keywords = array['achar', 'amla', 'pachadi', 'pickle', 'usirika', 'ఉసిరిక పచ్చడి'] where name = 'Usirika Pachadi (Amla Pickle)';
update public.products set keywords = array['achar', 'bellam', 'magaya', 'pachadi', 'pickle', 'sweet', 'బెల్లం మాగాయి'] where name = 'Bellam Magaya (Sweet Magaya)';
update public.products set keywords = array['achar', 'hot', 'karam', 'magaya', 'pachadi', 'pickle', 'కారం మాగాయి'] where name = 'Karam Magaya (Hot Magaya)';
update public.products set keywords = array['achar', 'pachadi', 'pickle', 'tokkudu', 'తొక్కుడు పచ్చడి'] where name = 'Tokkudu Pachadi';
update public.products set keywords = array['achar', 'koru', 'pachadi', 'pickle', 'కోరు పచ్చడి'] where name = 'Koru Pachadi';
update public.products set keywords = array['achar', 'chintakaya', 'pachadi', 'pickle', 'sweet', 'tamarind', 'చింతకాయ పచ్చడి'] where name = 'Chintakaya Pachadi (Sweet Tamarind)';

commit;
