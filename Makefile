.PHONY: up down logs migrate makemigrations seed demo-night demo-reset test lint schema shell build

up:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f

build:
	docker compose build backend worker beat

migrate:
	docker compose run --rm backend python manage.py migrate

makemigrations:
	docker compose run --rm backend python manage.py makemigrations $(APP)

seed:
	-docker compose run --rm backend python manage.py seed_content
	-docker compose run --rm backend python manage.py seed_demo

demo-reset:  ## wipe the DB (e.g. after E2E runs) and reseed the demo story
	docker compose down -v
	docker compose up -d db redis backend
	docker compose run --rm backend sh -c "python manage.py migrate && python manage.py seed_content && python manage.py seed_demo && python manage.py demo_night"

demo-night:
	docker compose run --rm backend python manage.py demo_night

test:
	docker compose run --rm backend pytest
	if [ -d frontend ]; then cd frontend && npm test -- --run; fi

lint:
	docker compose run --rm backend ruff check .
	if [ -d frontend ]; then cd frontend && npm run lint; fi

schema:
	docker compose run --rm backend python manage.py spectacular --file schema.yml

shell:
	docker compose run --rm backend python manage.py shell
