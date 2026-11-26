-- Avatar persistente para la cuenta y para cada integrante familiar.
-- JSON validado también en la API; datos previos siguen con el avatar base.
ALTER TABLE users ADD COLUMN avatar_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE members ADD COLUMN avatar_json TEXT NOT NULL DEFAULT '{}';
