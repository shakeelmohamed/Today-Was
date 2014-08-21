CREATE FUNCTION upsert_rating(userID TEXT, ratingID INT, journalEntry TEXT, GMTOffset TEXT) RETURNS VOID AS
$$
BEGIN
    LOOP
        -- first try to update the key
        UPDATE user_ratings 
            SET id_ratings=ratingID, entry=journalEntry, edited_date=DEFAULT 
            WHERE id=(SELECT id FROM user_ratings WHERE id_users=(SELECT users.id FROM users WHERE users.username=userID)
                AND (date_trunc('day', localtimestamp AT TIME ZONE GMTOffset)=date_trunc('day', user_ratings.created_date AT TIME ZONE GMTOffset)));
        IF found THEN
            RETURN;
        END IF;
        -- not there, so try to insert the key
        -- if someone else inserts the same key concurrently,
        -- we could get a unique-key failure
        BEGIN
            INSERT INTO user_ratings(id, id_users, id_ratings, entry) VALUES (DEFAULT, (SELECT users.id FROM users WHERE users.username=userID), ratingID, journalEntry);
            RETURN;
        EXCEPTION WHEN unique_violation THEN
            -- Do nothing, and loop to try the UPDATE again.
        END;
    END LOOP;
END;
$$
LANGUAGE plpgsql;