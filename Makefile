create_db:
	docker exec -it presenting-db createdb --username=presenting --owner=presenting presenting

drop_db:
	docker exec -it presenting-db dropdb presenting -U presenting

.PHONY: create_db drop_db

