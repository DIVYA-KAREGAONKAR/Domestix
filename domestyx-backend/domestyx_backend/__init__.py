'''import pymysql
pymysql.install_as_MySQLdb()
import pymysql'''
import pymysql


# This must come BEFORE install_as_MySQLdb()
pymysql.version_info = (2, 2, 1, "final", 0)
pymysql.install_as_MySQLdb()