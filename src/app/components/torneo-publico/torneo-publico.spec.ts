import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TorneoPublico } from './torneo-publico';

describe('TorneoPublico', () => {
  let component: TorneoPublico;
  let fixture: ComponentFixture<TorneoPublico>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TorneoPublico]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TorneoPublico);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
