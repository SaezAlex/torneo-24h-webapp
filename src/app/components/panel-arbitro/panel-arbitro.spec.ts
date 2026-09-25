import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PanelArbitro } from './panel-arbitro';

describe('PanelArbitro', () => {
  let component: PanelArbitro;
  let fixture: ComponentFixture<PanelArbitro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PanelArbitro]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PanelArbitro);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
