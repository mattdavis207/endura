begin;

alter domain public.sport_type_dom
    drop constraint if exists sport_type_dom_check;

alter domain public.sport_type_dom
    add constraint sport_type_dom_check check (
        value in (
            'swim',
            'bike',
            'run',
            'strength',
            'mobility',
            'brick',
            'other',
            'running',
            'ride',
            'cycling',
            'virtualride',
            'mountainbikeride',
            'gravelride',
            'ebikeride',
            'emountainbikeride',
            'handcycle',
            'velomobile',
            'walk',
            'hike',
            'trailrun',
            'workout',
            'weighttraining',
            'yoga',
            'crossfit',
            'highintensityintervaltraining',
            'pilates',
            'elliptical',
            'stairstepper',
            'alpineski',
            'backcountryski',
            'nordicski',
            'snowboard',
            'snowshoe',
            'iceskate',
            'inlineskate',
            'rollerski',
            'canoeing',
            'kayaking',
            'kitesurf',
            'rowing',
            'standuppaddling',
            'surfing',
            'swimrun',
            'windsurf',
            'sailing',
            'badminton',
            'golf',
            'tennis',
            'pickleball',
            'racquetsport',
            'soccer',
            'squash',
            'tabletennis',
            'wheelchair'
        )
    );

commit;
