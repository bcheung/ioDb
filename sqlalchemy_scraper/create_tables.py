import csv
import locale
from api.db import db, create_app
from api.models.visit import Visit
from api.models.industry import Industry3dModel, Industry4dModel
from api.models.occupation import OccupationMajorModel, OccupationDetailedModel
from api.models.location import StateModel, MetroAreaModel
from api.models.industry_occupation import Ind3dOccMajorModel, Ind4dOccMajorModel, Ind3dOccDetailedModel, Ind4dOccDetailedModel
from api.models.location_occupation import StateOccMajorModel, MetroAreaOccMajorModel, StateOccDetailedModel, MetroAreaOccDetailedModel


locale.setlocale(locale.LC_ALL, 'en_US.UTF-8')


def populate_occupations():
    with app.app_context():
        line_cnt = major_cnt = detailed_cnt = 0
        with open('sqlalchemy_scraper/national_occupations_by_group.csv', 'r') as f:
            reader = csv.reader(f)
            for line in reader:
                if line_cnt > 0:
                    occupation_data = line
                    occ_group = occupation_data[2]
                    if occ_group == "major" or occ_group == "detailed":
                        occ_code = occupation_data[0]
                        title = occupation_data[1]
                        total_employment = parse_int(occupation_data[3])
                        hourly_mean = parse_float(occupation_data[5])
                        hourly_median = parse_float(occupation_data[10])
                        annual_mean = parse_int(occupation_data[6])
                        annual_median = parse_int(occupation_data[15])
                        if occ_group == "major":
                            occupation = OccupationMajorModel(
                                occ_code, title, total_employment, hourly_mean, hourly_median, annual_mean, annual_median)
                            occupation_major = occupation
                            major_cnt += 1
                        else:
                            occupation = OccupationDetailedModel(
                                occ_code, title, total_employment, hourly_mean, hourly_median, annual_mean, annual_median)
                            occupation_major.occupations_detailed.append(
                                occupation)
                            detailed_cnt += 1
                        db.session.add(occupation)
                line_cnt += 1
        db.session.commit()
        return line_cnt, major_cnt, detailed_cnt


def populate_industries_3d():
    # Populate industries_3d, ind_3d_occ_major, ind_3d_occ_detailed tables
    with open('sqlalchemy_scraper/industries_3d.csv', 'r') as f:
        line_cnt = ind_3d_cnt = major_cnt = detailed_cnt = 0
        reader = csv.reader(f)
        for line in reader:
            if line_cnt > 0:
                industry_data = line
                industry_3d_id = industry_data[0]
                title = industry_data[1]
                occ_code = industry_data[2]
                occ_group = industry_data[4]
                total_employment = parse_int(industry_data[5])
                hourly_mean = parse_float(industry_data[9])
                hourly_median = parse_float(industry_data[14])
                annual_mean = parse_int(industry_data[10])
                annual_median = parse_int(industry_data[19])
                if occ_group == 'total':
                    industry_3d = Industry3dModel(
                        industry_3d_id, title, total_employment, hourly_mean, hourly_median, annual_mean, annual_median)
                    db.session.add(industry_3d)
                    ind_3d_cnt += 1
                elif occ_group == 'major':
                    ind_3d_occ_major = Ind3dOccMajorModel(
                        total_employment, hourly_mean, hourly_median, annual_mean, annual_median)
                    ind_3d_occ_major.industry_3d_id = industry_3d_id
                    ind_3d_occ_major.occupation_major_id = occ_code
                    db.session.add(ind_3d_occ_major)
                    major_cnt += 1
                elif occ_group == 'detailed':
                    ind_3d_occ_detailed = Ind3dOccDetailedModel(
                        total_employment, hourly_mean, hourly_median, annual_mean, annual_median)
                    ind_3d_occ_detailed.industry_3d_id = industry_3d_id
                    ind_3d_occ_detailed.occupation_detailed_id = occ_code
                    db.session.add(ind_3d_occ_detailed)
                    detailed_cnt += 1
            line_cnt += 1
        db.session.commit()
        return line_cnt, ind_3d_cnt, major_cnt, detailed_cnt


def populate_industries_4d():
    # Populate industries_4d, ind_4d_occ_major, ind_4d_occ_detailed tables
    with open('sqlalchemy_scraper/industries_4d.csv', 'r') as f:
        line_cnt = ind_4d_cnt = major_cnt = detailed_cnt = 0
        reader = csv.reader(f)
        for line in reader:
            if line_cnt > 0:
                industry_data = line
                industry_4d_id = industry_data[0]
                title = industry_data[1]
                occ_code = industry_data[2]
                occ_group = industry_data[4]
                total_employment = parse_int(industry_data[5])
                hourly_mean = parse_float(industry_data[9])
                hourly_median = parse_float(industry_data[14])
                annual_mean = parse_int(industry_data[10])
                annual_median = parse_int(industry_data[19])
                if occ_group == 'total':
                    industry_4d = Industry4dModel(
                        industry_4d_id, title, total_employment, hourly_mean, hourly_median, annual_mean, annual_median)
                    db.session.add(industry_4d)
                    industry_3d = Industry3dModel.query.filter_by(
                        id=(industry_4d_id[0:3] + '000')).first()
                    industry_3d.industries_4d.append(industry_4d)
                    ind_4d_cnt += 1
                elif occ_group == 'major':
                    ind_4d_occ_major = Ind4dOccMajorModel(
                        total_employment, hourly_mean, hourly_median, annual_mean, annual_median)
                    ind_4d_occ_major.industry_4d_id = industry_4d_id
                    ind_4d_occ_major.occupation_major_id = occ_code
                    db.session.add(ind_4d_occ_major)
                    major_cnt += 1
                elif occ_group == 'detailed':
                    ind_4d_occ_detailed = Ind4dOccDetailedModel(
                        total_employment, hourly_mean, hourly_median, annual_mean, annual_median)
                    ind_4d_occ_detailed.industry_4d_id = industry_4d_id
                    ind_4d_occ_detailed.occupation_detailed_id = occ_code
                    db.session.add(ind_4d_occ_detailed)
                    detailed_cnt += 1
            line_cnt += 1
        db.session.commit()
        return line_cnt, ind_4d_cnt, major_cnt, detailed_cnt


def populate_states():
    # Populate states, states_occ_major, states_occ_detailed tables
    with open('sqlalchemy_scraper/occupations_by_state.csv', 'r') as f:
        line_cnt = states_cnt = major_cnt = detailed_cnt = 0
        reader = csv.reader(f)
        for line in reader:
            if line_cnt > 0:
                state_data = line
                state_id = state_data[1]
                name = state_data[2]
                occ_code = state_data[3]
                occ_group = state_data[5]
                total_employment = parse_int(state_data[6])
                jobs_1000 = parse_float(state_data[8])
                loc_quotient = parse_float(state_data[9])
                hourly_mean = parse_float(state_data[10])
                hourly_median = parse_float(state_data[15])
                annual_mean = parse_int(state_data[11])
                annual_median = parse_int(state_data[20])
                if occ_group == 'total':
                    state = StateModel(
                        state_id, name, total_employment, hourly_mean, hourly_median, annual_mean, annual_median)
                    db.session.add(state)
                    states_cnt += 1
                elif occ_group == 'major':
                    state_occ_major = StateOccMajorModel(
                        total_employment, jobs_1000, loc_quotient, hourly_mean, hourly_median, annual_mean, annual_median)
                    state_occ_major.state_id = state_id
                    state_occ_major.occupation_major_id = occ_code
                    db.session.add(state_occ_major)
                    major_cnt += 1
                elif occ_group == 'detailed':
                    state_occ_detailed = StateOccDetailedModel(
                        total_employment, jobs_1000, loc_quotient, hourly_mean, hourly_median, annual_mean, annual_median)
                    state_occ_detailed.state_id = state_id
                    state_occ_detailed.occupation_detailed_id = occ_code
                    db.session.add(state_occ_detailed)
                    detailed_cnt += 1
            line_cnt += 1
        db.session.commit()
        return line_cnt, states_cnt, major_cnt, detailed_cnt


def populate_metro_areas():
    # Populate metro_areas, metro_areas_occ_major, metro_areas_occ_detailed tables
    with open('sqlalchemy_scraper/occupations_by_metropolitan_areas.csv', 'r') as f:
        line_cnt = metro_areas_cnt = major_cnt = detailed_cnt = 0
        reader = csv.reader(f)
        for line in reader:
            if line_cnt > 0:
                metro_data = line
                state_id = metro_data[0]
                metro_area_id = metro_data[1]
                name = metro_data[2]
                occ_code = metro_data[3]
                occ_group = metro_data[5]
                total_employment = parse_int(metro_data[6])
                jobs_1000 = parse_float(metro_data[8])
                loc_quotient = parse_float(metro_data[9])
                hourly_mean = parse_float(metro_data[10])
                hourly_median = parse_float(metro_data[15])
                annual_mean = parse_int(metro_data[11])
                annual_median = parse_int(metro_data[20])
                if occ_group == 'total':
                    metro_area = MetroAreaModel(
                        metro_area_id, name, total_employment, hourly_mean, hourly_median, annual_mean, annual_median)
                    db.session.add(metro_area)
                    state = StateModel.query.filter_by(id=(state_id)).first()
                    state.metro_areas.append(metro_area)
                    metro_areas_cnt += 1
                elif occ_group == 'major':
                    metro_area_occ_major = MetroAreaOccMajorModel(
                        total_employment, jobs_1000, loc_quotient, hourly_mean, hourly_median, annual_mean, annual_median)
                    metro_area_occ_major.metro_area_id = metro_area_id
                    metro_area_occ_major.occupation_major_id = occ_code
                    db.session.add(metro_area_occ_major)
                    major_cnt += 1
                elif occ_group == 'detailed':
                    metro_area_occ_detailed = MetroAreaOccDetailedModel(
                        total_employment, jobs_1000, loc_quotient, hourly_mean, hourly_median, annual_mean, annual_median)
                    metro_area_occ_detailed.metro_area_id = metro_area_id
                    metro_area_occ_detailed.occupation_detailed_id = occ_code
                    db.session.add(metro_area_occ_detailed)
                    detailed_cnt += 1
            line_cnt += 1
        db.session.commit()
        return line_cnt, metro_areas_cnt, major_cnt, detailed_cnt


def parse_float(value):
    try:
        return locale.atof(value)
    except ValueError:
        switcher = {
            '**': -1.0,
            '*': -1.0,
            '#': 100.0
        }
        return switcher.get(value, 0.0)


def parse_int(value):
    try:
        return locale.atoi(value)
    except ValueError:
        switcher = {
            '**': -1,
            '*': -1,
            '#': 208000
        }
        return switcher.get(value, 0.0)


if __name__ == '__main__':
    app = create_app()
    app.app_context().push()
    with app.app_context():
        print('Creating all database tables...')
        db.create_all()
        print('Done creating tables!')
        line_cnt, major_cnt, detailed_cnt = populate_occupations()
        print('Done populating occupation tables! line_cnt: {}, major_cnt: {}, detailed_cnt: {}'.format(
            line_cnt, major_cnt, detailed_cnt))
        line_cnt, ind_3d_cnt, major_cnt, detailed_cnt = populate_industries_3d()
        print('Done populating industry 3d tables! line_cnt: {}, ind_3d_cnt: {} major_cnt: {}, detailed_cnt: {}'.format(
            line_cnt, ind_3d_cnt, major_cnt, detailed_cnt))
        line_cnt, ind_4d_cnt, major_cnt, detailed_cnt = populate_industries_4d()
        print('Done populating industry 4d tables! line_cnt: {}, ind_4d_cnt: {} major_cnt: {}, detailed_cnt: {}'.format(
            line_cnt, ind_4d_cnt, major_cnt, detailed_cnt))
        line_cnt, state_cnt, major_cnt, detailed_cnt = populate_states()
        print('Done populating state tables! line_cnt: {}, state_cnt: {} major_cnt: {}, detailed_cnt: {}'.format(
            line_cnt, state_cnt, major_cnt, detailed_cnt))
        line_cnt, metro_areas_cnt, major_cnt, detailed_cnt = populate_metro_areas()
        print('Done populating metro areas tables! line_cnt: {}, metro_areas_cnt: {} major_cnt: {}, detailed_cnt: {}'.format(
            line_cnt, metro_areas_cnt, major_cnt, detailed_cnt))
