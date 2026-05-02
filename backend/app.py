from flask import Flask, request, jsonify, make_response, render_template
import sqlite3
import os
from datetime import datetime
from openpyxl import Workbook
from io import BytesIO

app = Flask(__name__, 
            static_folder='static',
            template_folder='templates')

@app.route('/')
def index():
    return render_template('index.html')

ADMIN_USERNAME = 'admin'
ADMIN_PASSWORD = 'admin123'

DATABASE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'feedback.db')

def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nickname TEXT NOT NULL,
            visit_date TEXT NOT NULL,
            food_rating INTEGER NOT NULL,
            service_rating INTEGER NOT NULL,
            comment TEXT,
            created_at TEXT NOT NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS admin (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        )
    ''')
    
    try:
        cursor.execute('INSERT INTO admin (username, password) VALUES (?, ?)', 
                      (ADMIN_USERNAME, ADMIN_PASSWORD))
    except sqlite3.IntegrityError:
        pass
    
    conn.commit()
    conn.close()

@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    data = request.get_json()
    
    if not data.get('nickname') or not data.get('visit_date'):
        return jsonify({'error': '昵称和就餐日期不能为空'}), 400
    
    food_rating = data.get('food_rating', 3)
    service_rating = data.get('service_rating', 3)
    
    if not (1 <= food_rating <= 5) or not (1 <= service_rating <= 5):
        return jsonify({'error': '评分必须在1-5之间'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO feedback (nickname, visit_date, food_rating, service_rating, comment, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        data['nickname'],
        data['visit_date'],
        food_rating,
        service_rating,
        data.get('comment', ''),
        datetime.now().isoformat()
    ))
    
    conn.commit()
    feedback_id = cursor.lastrowid
    conn.close()
    
    return jsonify({
        'id': feedback_id,
        'message': '反馈提交成功'
    }), 201

@app.route('/api/feedback', methods=['GET'])
def get_feedback_list():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    food_rating_filter = request.args.get('food_rating')
    service_rating_filter = request.args.get('service_rating')
    date_from = request.args.get('date_from')
    date_to = request.args.get('date_to')
    sort_by = request.args.get('sort_by', 'created_at')
    sort_order = request.args.get('sort_order', 'desc')
    
    query = '''
        SELECT id, nickname, visit_date, food_rating, service_rating, comment, created_at
        FROM feedback
        WHERE 1=1
    '''
    params = []
    
    if food_rating_filter:
        query += ' AND food_rating = ?'
        params.append(int(food_rating_filter))
    
    if service_rating_filter:
        query += ' AND service_rating = ?'
        params.append(int(service_rating_filter))
    
    if date_from:
        query += ' AND visit_date >= ?'
        params.append(date_from)
    
    if date_to:
        query += ' AND visit_date <= ?'
        params.append(date_to)
    
    valid_sort_columns = ['created_at', 'visit_date', 'food_rating', 'service_rating']
    if sort_by not in valid_sort_columns:
        sort_by = 'created_at'
    
    valid_sort_orders = ['asc', 'desc']
    if sort_order not in valid_sort_orders:
        sort_order = 'desc'
    
    query += f' ORDER BY {sort_by} {sort_order}'
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    feedback_list = []
    for row in rows:
        feedback_list.append({
            'id': row['id'],
            'nickname': row['nickname'],
            'visit_date': row['visit_date'],
            'food_rating': row['food_rating'],
            'service_rating': row['service_rating'],
            'comment': row['comment'],
            'created_at': row['created_at']
        })
    
    return jsonify(feedback_list)

@app.route('/api/feedback/<int:feedback_id>', methods=['DELETE'])
def delete_feedback(feedback_id):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': '未授权，请先登录'}), 401
    
    token = auth_header.split(' ')[1]
    if token != 'admin_token':
        return jsonify({'error': '无效的认证令牌'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM feedback WHERE id = ?', (feedback_id,))
    conn.commit()
    
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'error': '反馈记录不存在'}), 404
    
    conn.close()
    return jsonify({'message': '反馈已删除'}), 200

@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': '未授权，请先登录'}), 401
    
    token = auth_header.split(' ')[1]
    if token != 'admin_token':
        return jsonify({'error': '无效的认证令牌'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT 
            COUNT(*) as total_count,
            AVG(food_rating) as avg_food_rating,
            AVG(service_rating) as avg_service_rating
        FROM feedback
    ''')
    overall_stats = cursor.fetchone()
    
    cursor.execute('''
        SELECT 
            food_rating,
            COUNT(*) as count
        FROM feedback
        GROUP BY food_rating
        ORDER BY food_rating
    ''')
    food_rating_distribution = {row['food_rating']: row['count'] for row in cursor.fetchall()}
    
    cursor.execute('''
        SELECT 
            service_rating,
            COUNT(*) as count
        FROM feedback
        GROUP BY service_rating
        ORDER BY service_rating
    ''')
    service_rating_distribution = {row['service_rating']: row['count'] for row in cursor.fetchall()}
    
    conn.close()
    
    return jsonify({
        'total_count': overall_stats['total_count'],
        'avg_food_rating': round(overall_stats['avg_food_rating'] or 0, 2),
        'avg_service_rating': round(overall_stats['avg_service_rating'] or 0, 2),
        'food_rating_distribution': food_rating_distribution,
        'service_rating_distribution': service_rating_distribution
    })

@app.route('/api/export/excel', methods=['GET'])
def export_excel():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': '未授权，请先登录'}), 401
    
    token = auth_header.split(' ')[1]
    if token != 'admin_token':
        return jsonify({'error': '无效的认证令牌'}), 401
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT id, nickname, visit_date, food_rating, service_rating, comment, created_at
        FROM feedback
        ORDER BY created_at DESC
    ''')
    rows = cursor.fetchall()
    conn.close()
    
    wb = Workbook()
    ws = wb.active
    ws.title = "顾客反馈"
    
    headers = ['ID', '昵称', '就餐日期', '菜品评分', '服务评分', '评价内容', '提交时间']
    ws.append(headers)
    
    for row in rows:
        ws.append([
            row['id'],
            row['nickname'],
            row['visit_date'],
            row['food_rating'],
            row['service_rating'],
            row['comment'],
            row['created_at']
        ])
    
    for col in ws.columns:
        max_length = 0
        column = col[0].column_letter
        for cell in col:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        adjusted_width = (max_length + 2)
        ws.column_dimensions[column].width = adjusted_width
    
    output = BytesIO()
    wb.save(output)
    output.seek(0)
    
    response = make_response(output.getvalue())
    response.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    response.headers['Content-Disposition'] = f'attachment; filename=feedback_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
    
    return response

@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json()
    
    if not data.get('username') or not data.get('password'):
        return jsonify({'error': '用户名和密码不能为空'}), 400
    
    if data['username'] == ADMIN_USERNAME and data['password'] == ADMIN_PASSWORD:
        return jsonify({
            'message': '登录成功',
            'token': 'admin_token',
            'username': ADMIN_USERNAME
        })
    else:
        return jsonify({'error': '用户名或密码错误'}), 401

@app.route('/<path:path>')
def catch_all(path):
    if path.startswith('api/'):
        return jsonify({'error': 'API路由不存在'}), 404
    
    if path.startswith('static/'):
        return '', 404
    
    return render_template('index.html')

if __name__ == '__main__':
    init_db()
    app.run(debug=False, host='127.0.0.1', port=5000)
