.PHONY: dev-db stop-db clean-db run test client prod-up prod-down

dev-db:
	$(MAKE) -C server dev-db

stop-db:
	$(MAKE) -C server stop-db

clean-db:
	$(MAKE) -C server clean-db

run:
	$(MAKE) -C server run

test:
	$(MAKE) -C server test

client:
	cd client && npm run dev

prod-up:
	docker compose -f docker-compose.prod.yml up -d --build

prod-down:
	docker compose -f docker-compose.prod.yml down
