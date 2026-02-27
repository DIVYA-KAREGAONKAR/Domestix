from django.db import migrations


def repair_otp_legacy_code_column(apps, schema_editor):
    table_name = "users_otpverification"
    connection = schema_editor.connection

    with connection.cursor() as cursor:
        existing_tables = connection.introspection.table_names(cursor)
        if table_name not in existing_tables:
            return

        cursor.execute(f"SHOW COLUMNS FROM {table_name} LIKE 'code'")
        row = cursor.fetchone()
        if not row:
            return

        # SHOW COLUMNS returns: Field, Type, Null, Key, Default, Extra
        _field, column_type, is_nullable, _key, default_value, _extra = row

        # Legacy bad state: code exists but is mandatory with no default,
        # which breaks inserts now that the app stores only code_hash.
        if is_nullable == "NO" and default_value is None:
            schema_editor.execute(
                f"ALTER TABLE {table_name} MODIFY COLUMN code {column_type} NULL DEFAULT NULL"
            )


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("users", "0006_repair_otp_code_hash_column"),
    ]

    operations = [
        migrations.RunPython(repair_otp_legacy_code_column, migrations.RunPython.noop),
    ]
