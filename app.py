from flask import Flask, render_template
from flask_frozen import Freezer
import json, os

FREEZE = True

app = Flask(__name__)
freezer = Freezer(app)

# Load Projects
project_data_files = ['./projects/' + x for x in os.listdir('./projects/') if x.endswith('.json')]
project_list = []
projects = {}
for data_file in project_data_files:
    with open(data_file, 'r') as file:
        project = json.load(file)
        project_list.append(project)
        projects[project['name']] = project


@app.route('/')
def index():
    return render_template('index.html', projects=project_list)

@app.route('/project/<project_name>')
def project(project_name=''):
    return render_template('project.html', project=projects[project_name])

@freezer.register_generator
def project():
    for project in project_list:
        yield {'project_name': project['name']}

if __name__ == '__main__':
    if FREEZE:
        # Build the Web application
        freezer.freeze()
    else:
        # Debug Launching
        app.run()