from django.db import migrations


def repair_otp_code_hash_column(apps, schema_editor):
    table_name = "users_otpverification"
    connection = schema_editor.connection

    with connection.cursor() as cursor:
        existing_tables = connection.introspection.table_names(cursor)
        if table_name not in existing_tables:
            return

        columns = {
            column.name
            for column in connection.introspection.get_table_description(cursor, table_name)
        }

        if "code_hash" not in columns:
            # DB-only repair for instances where 0005 was applied before code_hash existed.
            schema_editor.execute(
                "ALTER TABLE users_otpverification "
                "ADD COLUMN code_hash varchar(255) NOT NULL DEFAULT ''"
            )


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("users", "0005_customuser_marketing_opt_in_and_more"),
    ]

    operations = [
        migrations.RunPython(repair_otp_code_hash_column, migrations.RunPython.noop),
    ]
