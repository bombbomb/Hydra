from app import db
from sqlalchemy.dialects.postgresql import JSON


class Infrastructure(db.Model):
    __tablename__ = 'infrastructure'

    id = db.Column(db.Integer, primary_key=True)
    regions = db.relationship('Region', backref='infrastructure', lazy='dynamic')

    def __init__(self, regions):
        self.regions = regions

    def __repr__(self):
        return '<Infrastructure {}>' % self.id

class Region(db.model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    infrastructure_id = db.Column(db.Integer, db.ForeignKey('Infrastructure.id'))
    environments = db.relationship('Environments', backref='regions', lazy='dynamic')

    def __init__(self, name, environments):
        self.name = name
        self.environments = environments

    def __repr__(self):
        return '<Region {}>' % self.name

class Environments(db.model):
    id = db.Column(db.Integer, primary_key=True)
    status = db.Column(db.String)
    instance_count = db.Column(db.Integer)
    traffic_weight = db.Column(db.Float)
    regionId = db.Column(db.Integer, db.ForeignKey('Region.id'))

    def __init__(self, status, instance_count, traffic_weight):
        self.status = status
        self.instance_count = instance_count
        self.traffic_weight = traffic_weight

    def __repr__(self):
        return '<Environments {}>' % self.name


